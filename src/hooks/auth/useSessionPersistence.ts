import { useCallback, useRef, useEffect } from 'react';
import { useAuthStateMachine } from './useAuthStateMachine';
import { monitorResourceLoad } from '@/utils/resourceMonitor';
import { withRetry, defaultRetryConfig } from '@/utils/requestUtils';
import * as Sentry from '@sentry/react';

interface SessionData {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'auth_session';
const TOKEN_REFRESH_MARGIN = 5 * 60 * 1000; // 5 minutes

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

  const clearSession = useCallback(() => {
    storeSession(null);
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = undefined;
    }
    authState.setState('UNAUTHENTICATED');
  }, [authState]);

  const refreshToken = useCallback(async () => {
    if (refreshInProgressRef.current) return;
    refreshInProgressRef.current = true;

    try {
      const session = getStoredSession();
      if (!session) {
        clearSession();
        return;
      }

      const operation = async () => {
        // Replace with your actual token refresh API call
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const newSession: SessionData = await response.json();
        storeSession(newSession);
        scheduleTokenRefresh(newSession.expiresAt);
        return newSession;
      };

      await withRetry(operation, {
        ...defaultRetryConfig,
        maxRetries: 3,
      });

      authState.setState('AUTHENTICATED');
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (import.meta.env.PROD) {
        Sentry.captureException(error, {
          tags: { type: 'token_refresh_failed' },
        });
      }
      clearSession();
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [authState, clearSession]);

  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }

    const now = Date.now();
    const refreshTime = expiresAt - TOKEN_REFRESH_MARGIN;
    
    if (refreshTime > now) {
      refreshTimerRef.current = window.setTimeout(refreshToken, refreshTime - now);
    } else {
      refreshToken();
    }
  }, [refreshToken]);

  const persistSession = useCallback(async (session: SessionData) => {
    await monitorResourceLoad('session_persistence', async () => {
      storeSession(session);
      scheduleTokenRefresh(session.expiresAt);
      authState.setState('AUTHENTICATED');
    });
  }, [authState, scheduleTokenRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  return {
    persistSession,
    clearSession,
    refreshToken,
    getStoredSession,
  };
}; 