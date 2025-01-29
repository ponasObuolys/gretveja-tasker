import { useEffect, useCallback, useRef } from 'react';
import { useAuthStateMachine, withAuthStateTracking } from './useAuthStateMachine';
import { useSessionPersistence } from './useSessionPersistence';
import * as Sentry from '@sentry/react';

const MAX_INIT_RETRIES = 3;
const INIT_RETRY_DELAY = 1000;

export const useAuthInitialization = () => {
  const authState = useAuthStateMachine();
  const { getStoredSession, refreshToken, clearSession } = useSessionPersistence();
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const initialize = useCallback(async () => {
    if (!mountedRef.current) return;
    
    // Prevent concurrent initialization attempts
    if (!authState.acquireInitLock()) {
      console.log('Auth initialization already in progress or too recent');
      return;
    }

    try {
      await withAuthStateTracking(
        async () => {
          const session = getStoredSession();
          if (!session) {
            console.log('No stored session found');
            clearSession();
            authState.setState('UNAUTHENTICATED');
            return;
          }

          // Check if session is expired
          if (session.expiresAt <= Date.now()) {
            console.log('Session expired, attempting refresh');
            await refreshToken();
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

    const initAuth = async () => {
      if (!mountedRef.current) return;
      await initialize();
    };

    if (authState.state === 'IDLE') {
      console.log('Starting auth initialization');
      initAuth();
    }

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      authState.clearSubscriptions();
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