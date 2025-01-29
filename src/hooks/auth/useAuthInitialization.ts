import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuthStateMachine, withAuthStateTracking } from './useAuthStateMachine';
import { useSessionPersistence } from './useSessionPersistence';
import * as Sentry from '@sentry/react';
import { useNavigate, useLocation } from 'react-router-dom';

// Circuit breaker configuration
const MAX_AUTH_ATTEMPTS = 1;
const AUTH_TIMEOUT = 5000;
const PREVENT_REDIRECT = true;

type AuthState = 'IDLE' | 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'LOCKED' | 'TIMEOUT';

export const useAuthInitialization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authState = useAuthStateMachine();
  const { getStoredSession, refreshToken, clearSession } = useSessionPersistence();
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const initLockRef = useRef(false);
  const [authTimeout, setAuthTimeout] = useState(false);
  const isAuthPage = location.pathname.startsWith('/auth');

  const clearAuthStates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    retryCount.current = 0;
    initLockRef.current = false;
    clearSession();
  }, [clearSession]);

  const handleTimeout = useCallback(() => {
    if (!mountedRef.current) return;
    
    console.log('Auth initialization timeout');
    setAuthTimeout(true);
    authState.setState('TIMEOUT');
    clearAuthStates();
    
    if (!PREVENT_REDIRECT && !isAuthPage) {
      navigate('/auth', { replace: true });
    }
  }, [navigate, clearAuthStates, authState, isAuthPage]);

  const initialize = useCallback(async () => {
    if (!mountedRef.current || initLockRef.current || isAuthPage) {
      console.log('Auth initialization skipped:', {
        mounted: mountedRef.current,
        locked: initLockRef.current,
        isAuthPage
      });
      return;
    }

    console.log('Starting auth initialization');
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
            if (!isAuthPage) {
              navigate('/auth', { replace: true });
            }
            return;
          }

          if (session.expiresAt <= Date.now()) {
            console.log('Session expired, attempting refresh');
            await refreshToken();
            authState.setState('AUTHENTICATED');
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
        if (!PREVENT_REDIRECT && !isAuthPage) {
          navigate('/auth', { replace: true });
        }
      }
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      initLockRef.current = false;
    }
  }, [
    authState,
    getStoredSession,
    refreshToken,
    clearSession,
    navigate,
    handleTimeout,
    isAuthPage
  ]);

  const forceRefresh = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setAuthTimeout(false);
    clearAuthStates();
    authState.resetState();
    
    // Small delay to ensure state is cleared before reinitializing
    setTimeout(() => {
      if (mountedRef.current) {
        initialize();
      }
    }, 100);
  }, [initialize, clearAuthStates, authState]);

  useEffect(() => {
    mountedRef.current = true;

    // Only initialize if we're not on the auth page and in IDLE state
    if (authState.state === 'IDLE' && !isAuthPage) {
      initialize();
    }

    return () => {
      console.log('Auth initialization cleanup');
      mountedRef.current = false;
      clearAuthStates();
    };
  }, [initialize, authState.state, clearAuthStates, isAuthPage]);

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