import { useEffect, useCallback, useRef } from 'react';
import { useAuthStateMachine, withAuthStateTracking } from './useAuthStateMachine';
import { useSessionPersistence } from './useSessionPersistence';
import * as Sentry from '@sentry/react';

const MAX_INIT_RETRIES = 3;
const INIT_RETRY_DELAY = 1000;
const INIT_DEBOUNCE = 2000; // 2 seconds debounce for initialization attempts

export const useAuthInitialization = () => {
  const authState = useAuthStateMachine();
  const { getStoredSession, refreshToken, clearSession } = useSessionPersistence();
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const lastInitAttemptRef = useRef<number>(0);

  const initialize = useCallback(async () => {
    if (!mountedRef.current) return;
    
    // Debounce initialization attempts
    const now = Date.now();
    if (now - lastInitAttemptRef.current < INIT_DEBOUNCE) {
      console.log('Initialization attempted too soon, skipping');
      return;
    }
    lastInitAttemptRef.current = now;

    // Prevent concurrent initialization attempts
    if (!authState.acquireInitLock()) {
      console.log('Auth initialization already in progress or too recent');
      return;
    }

    try {
      await withAuthStateTracking(
        async () => {
          const session = getStoredSession();
          
          // Clear any existing timeouts
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          if (!session) {
            console.log('No stored session found');
            clearSession();
            authState.setState('UNAUTHENTICATED');
            return;
          }

          // Check if session is expired
          if (session.expiresAt <= Date.now()) {
            console.log('Session expired, attempting refresh');
            try {
              await refreshToken();
              authState.setState('AUTHENTICATED');
            } catch (error) {
              console.error('Token refresh failed:', error);
              // Handle refresh token not found error gracefully
              if (error instanceof Error && 
                  error.message.includes('refresh_token_not_found')) {
                console.log('Refresh token not found, clearing session');
                clearSession();
                authState.setState('UNAUTHENTICATED');
                return;
              }
              clearSession();
              authState.setState('UNAUTHENTICATED');
            }
          } else {
            console.log('Valid session found');
            authState.setState('AUTHENTICATED');
          }
        },
        'INITIALIZING',
        'AUTHENTICATED'
      );
    } catch (error) {
      console.error('Auth initialization failed:', error);
      Sentry.captureException(error);

      if (retryCount.current < MAX_INIT_RETRIES && mountedRef.current) {
        retryCount.current++;
        console.log(`Retrying initialization (attempt ${retryCount.current}/${MAX_INIT_RETRIES})`);
        timeoutRef.current = setTimeout(initialize, INIT_RETRY_DELAY);
      } else {
        console.log('Max initialization retries reached');
        clearSession();
        authState.setState('UNAUTHENTICATED');
      }
    } finally {
      authState.releaseInitLock();
    }
  }, [authState, getStoredSession, refreshToken, clearSession]);

  useEffect(() => {
    mountedRef.current = true;
    lastInitAttemptRef.current = 0;

    const initAuth = async () => {
      if (!mountedRef.current) return;
      await initialize();
    };

    // Only initialize if we're in IDLE state and haven't attempted recently
    if (authState.state === 'IDLE' && Date.now() - lastInitAttemptRef.current >= INIT_DEBOUNCE) {
      console.log('Starting auth initialization');
      initAuth();
    }

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      authState.executeCleanup();
      retryCount.current = 0;
    };
  }, [initialize, authState.state]);

  return {
    isInitializing: authState.state === 'INITIALIZING',
    isAuthenticated: authState.state === 'AUTHENTICATED',
    error: authState.error,
    initialize,
  };
};