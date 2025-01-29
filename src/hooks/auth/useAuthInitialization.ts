import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuthStateMachine, withAuthStateTracking } from './useAuthStateMachine';
import { useSessionPersistence } from './useSessionPersistence';
import * as Sentry from '@sentry/react';
import { useNavigate } from 'react-router-dom';

// Circuit breaker configuration
const MAX_AUTH_ATTEMPTS = 1;
const AUTH_TIMEOUT = 5000;
const PREVENT_REDIRECT = true;

type AuthState = 'IDLE' | 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'LOCKED' | 'TIMEOUT';

export const useAuthInitialization = () => {
  const navigate = useNavigate();
  const authState = useAuthStateMachine();
  const { getStoredSession, refreshToken, clearSession } = useSessionPersistence();
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const initLockRef = useRef(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  const clearAuthStates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    retryCount.current = 0;
    initLockRef.current = false;
    // Only clear session data, not subscriptions
    clearSession();
  }, [clearSession]);

  const handleTimeout = useCallback(() => {
    console.log('Auth initialization timeout');
    setAuthTimeout(true);
    authState.setState('TIMEOUT');
    clearAuthStates();
    if (!PREVENT_REDIRECT) {
      navigate('/auth');
    }
  }, [navigate, clearAuthStates, authState]);

  const initialize = useCallback(async () => {
    if (!mountedRef.current || initLockRef.current) {
      console.log('Auth initialization skipped - component unmounted or locked');
      return;
    }

    initLockRef.current = true;
    timeoutRef.current = setTimeout(handleTimeout, AUTH_TIMEOUT);

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

      if (retryCount.current < MAX_AUTH_ATTEMPTS && mountedRef.current) {
        retryCount.current++;
        console.log(`Auth retry blocked - max attempts (${MAX_AUTH_ATTEMPTS}) enforced`);
        authState.setState('LOCKED');
      } else {
        console.log('Auth initialization failed permanently');
        clearSession();
        authState.setState('UNAUTHENTICATED');
        if (!PREVENT_REDIRECT) {
          navigate('/auth');
        }
      }
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      initLockRef.current = false;
    }
  }, [authState, getStoredSession, refreshToken, clearSession, navigate, handleTimeout]);

  const forceRefresh = useCallback(async () => {
    setAuthTimeout(false);
    clearAuthStates();
    // Small delay to ensure state is cleared before reinitializing
    setTimeout(() => {
      if (mountedRef.current) {
        initialize();
      }
    }, 100);
  }, [initialize, clearAuthStates]);

  useEffect(() => {
    mountedRef.current = true;

    if (authState.state === 'IDLE') {
      console.log('Starting auth initialization');
      initialize();
    }

    return () => {
      mountedRef.current = false;
      clearAuthStates();
    };
  }, [initialize, authState.state, clearAuthStates]);

  return {
    isInitializing: authState.state === 'INITIALIZING',
    isAuthenticated: authState.state === 'AUTHENTICATED',
    isLocked: authState.state === 'LOCKED',
    isTimedOut: authTimeout,
    error: authState.error,
    initialize,
    forceRefresh,
  };
}; 