import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionInitialization } from "@/hooks/auth/useSessionInitialization";
import { useAuthStateHandlers } from "@/hooks/auth/useAuthStateHandlers";
import { debounce } from "lodash";

// Enhanced session cache with expiry
const SESSION_CACHE_KEY = 'auth_session_cache';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

interface CachedSessionData {
  session: Session | null;
  timestamp: number;
}

const getSessionFromCache = (): Session | null => {
  const cached = localStorage.getItem(SESSION_CACHE_KEY);
  if (!cached) return null;
  
  const { session, timestamp } = JSON.parse(cached) as CachedSessionData;
  if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
    localStorage.removeItem(SESSION_CACHE_KEY);
    return null;
  }
  return session;
};

const setSessionToCache = (session: Session | null) => {
  const cacheData: CachedSessionData = {
    session,
    timestamp: Date.now()
  };
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cacheData));
};

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(() => getSessionFromCache());
  const [loading, setLoading] = useState(!getSessionFromCache());
  const { toast } = useToast();
  const mountedRef = useRef(true);
  const lastAuthEventRef = useRef<string | null>(null);

  const { initializeSession } = useSessionInitialization(
    (newSession) => {
      if (mountedRef.current) {
        setSession(newSession);
        setSessionToCache(newSession);
      }
    },
    (loadingState) => {
      if (mountedRef.current) {
        setLoading(loadingState);
      }
    }
  );

  const { onSignIn, onSignOut, onTokenRefresh } = useAuthStateHandlers(
    (newSession) => {
      if (mountedRef.current) {
        setSession(newSession);
        setSessionToCache(newSession);
      }
    },
    setLoading
  );

  const setupRefreshTimer = useCallback((currentSession: Session) => {
    if (!currentSession?.expires_at) return null;

    const expiresAt = new Date(currentSession.expires_at * 1000);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    if (timeUntilExpiry > refreshBuffer) {
      const refreshTime = timeUntilExpiry - refreshBuffer;
      console.log(`[Auth] Scheduling token refresh in ${Math.floor(refreshTime / 1000)}s`);
      
      return setTimeout(() => {
        if (mountedRef.current) {
          console.log("[Auth] Executing scheduled token refresh");
          supabase.auth.refreshSession();
        }
      }, refreshTime);
    }
    return null;
  }, []);

  // Memoized session setter to reduce re-renders
  const updateSession = useCallback((newSession: Session | null) => {
    if (mountedRef.current) {
      setSession(newSession);
      setSessionToCache(newSession);
    }
  }, []);

  // Optimized debounced auth state change handler
  const debouncedAuthStateChange = useCallback(
    debounce(async (event: string, currentSession: Session | null) => {
      if (!mountedRef.current || event === lastAuthEventRef.current) return;
      
      lastAuthEventRef.current = event;
      console.log("[Auth] Processing state change:", event, {
        hasSession: !!currentSession,
        user: currentSession?.user?.email
      });

      if (event === 'SIGNED_IN') {
        onSignIn(currentSession!);
        setupRefreshTimer(currentSession!);
      } else if (event === 'SIGNED_OUT') {
        onSignOut();
        localStorage.removeItem(SESSION_CACHE_KEY);
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        onTokenRefresh(currentSession);
        setupRefreshTimer(currentSession);
      }
    }, 1000), // Increased debounce time to 1 second
    [onSignIn, onSignOut, onTokenRefresh, setupRefreshTimer]
  );

  useEffect(() => {
    mountedRef.current = true;
    let refreshTimer: NodeJS.Timeout | null = null;

    const initialize = async () => {
      if (!mountedRef.current) return;

      if (!getSessionFromCache()) {
        console.log("[Auth] Starting new session initialization");
        await initializeSession(true);
      } else {
        console.log("[Auth] Using existing session");
      }

      if (mountedRef.current && session) {
        refreshTimer = setupRefreshTimer(session);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mountedRef.current) return;
        
        console.log("[Auth] State changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email,
          path: window.location.pathname
        });

        debouncedAuthStateChange(event, currentSession);
      }
    );

    initialize();

    return () => {
      mountedRef.current = false;
      debouncedAuthStateChange.cancel();
      if (refreshTimer) clearTimeout(refreshTimer);
      subscription.unsubscribe();
      console.log("[Auth] Cleaned up subscription and timers");
    };
  }, [debouncedAuthStateChange, initializeSession, session, setupRefreshTimer]);

  return { session, loading };
};