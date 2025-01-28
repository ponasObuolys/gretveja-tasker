import { useCallback, useRef, useEffect } from 'react';
import { useAuthStateMachine } from './useAuthStateMachine';
import { monitorResourceLoad } from '@/utils/resourceMonitor';
import { withRetry, defaultRetryConfig } from '@/utils/requestUtils';
import * as Sentry from '@sentry/react';
import { debounce } from 'lodash-es';

interface SessionData {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'auth_session';
const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000; // 5 minutes
const REFRESH_DEBOUNCE_WAIT = 1000; // 1 second

const getStoredSession = (): SessionData | null => {
  try {
    const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading session data:', error);
    return null;
  }
};

const storeSession = (session: SessionData | null) => {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error storing session data:', error);
  }
};

export const useSessionPersistence = () => {
  const authState = useAuthStateMachine();
  const refreshTimerRef = useRef<number>();
  const refreshInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  const clearSession = useCallback(() => {
    storeSession(null);
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = undefined;
    }
    authState.setState('UNAUTHENTICATED');
  }, [authState]);

  const debouncedRefreshToken = useCallback(
    debounce(async () => {
      if (!mountedRef.current || refreshInProgressRef.current) return;
      if (!authState.acquireRefreshLock()) return;

      refreshInProgressRef.current = true;
      authState.setState('TOKEN_REFRESHING');

      try {
        const session = getStoredSession();
        if (!session) {
          clearSession();
          return;
        }

        const operation = async () => {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: session.refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const newSession: SessionData = await response.json();
          if (mountedRef.current) {
            storeSession(newSession);
            scheduleTokenRefresh(newSession.expiresAt);
          }
          return newSession;
        };

        await withRetry(operation, {
          ...defaultRetryConfig,
          maxRetries: 3,
        });

        if (mountedRef.current) {
          authState.setState('AUTHENTICATED');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        if (import.meta.env.PROD) {
          Sentry.captureException(error, {
            tags: { type: 'token_refresh_failed' },
          });
        }
        if (mountedRef.current) {
          authState.setState('TOKEN_REFRESH_FAILED');
          clearSession();
        }
      } finally {
        refreshInProgressRef.current = false;
        authState.releaseRefreshLock();
      }
    }, REFRESH_DEBOUNCE_WAIT),
    [authState, clearSession]
  );

  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    const now = Date.now();
    const refreshTime = expiresAt - TOKEN_REFRESH_MARGIN;
    
    if (refreshTime > now) {
      refreshTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          authState.setState('TOKEN_REFRESH_NEEDED');
          debouncedRefreshToken();
        }
      }, refreshTime - now);
    } else {
      authState.setState('TOKEN_REFRESH_NEEDED');
      debouncedRefreshToken();
    }
  }, [authState, debouncedRefreshToken]);

  const persistSession = useCallback(async (session: SessionData) => {
    if (!mountedRef.current) return;

    await monitorResourceLoad('session_persistence', async () => {
      storeSession(session);
      scheduleTokenRefresh(session.expiresAt);
      authState.setState('AUTHENTICATED');
    });
  }, [authState, scheduleTokenRefresh]);

  useEffect(() => {
    mountedRef.current = true;

    // Add cleanup task to auth state machine
    authState.addCleanupTask(() => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      debouncedRefreshToken.cancel();
    });

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      debouncedRefreshToken.cancel();
    };
  }, [authState, debouncedRefreshToken]);

  return {
    persistSession,
    clearSession,
    refreshToken: debouncedRefreshToken,
    getStoredSession,
  };
}; 