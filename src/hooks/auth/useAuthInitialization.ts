import { useEffect, useCallback } from 'react';
import { useAuthStateMachine, withAuthStateTracking } from './useAuthStateMachine';
import { useSessionPersistence } from './useSessionPersistence';
import * as Sentry from '@sentry/react';

const MAX_INIT_RETRIES = 3;
const INIT_RETRY_DELAY = 1000;
let initRetries = 0;

export const useAuthInitialization = () => {
  const authState = useAuthStateMachine();
  const { getStoredSession, refreshToken, clearSession } = useSessionPersistence();

  const initialize = useCallback(async () => {
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
      if (initRetries < MAX_INIT_RETRIES) {
        initRetries++;
        console.log(`Retrying initialization (attempt ${initRetries}/${MAX_INIT_RETRIES})`);
        setTimeout(initialize, INIT_RETRY_DELAY);
      } else {
        console.log('Max initialization retries reached');
        clearSession();
      }
    } finally {
      authState.releaseInitLock();
    }
  }, [authState, getStoredSession, refreshToken, clearSession]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (!mounted) return;
      await initialize();
    };

    if (authState.state === 'IDLE' && initRetries === 0) {
      console.log('Starting auth initialization');
      initAuth();
    }

    return () => {
      mounted = false;
      // Clear any auth subscriptions here
      authState.clearSubscriptions();
    };
  }, [initialize, authState.state]);

  return {
    isInitializing: authState.state === 'INITIALIZING',
    isAuthenticated: authState.state === 'AUTHENTICATED',
    error: authState.error,
    initialize,
  };
}; 