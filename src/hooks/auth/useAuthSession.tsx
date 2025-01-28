import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionInitialization } from "@/hooks/auth/useSessionInitialization";
import { useAuthStateHandlers } from "@/hooks/auth/useAuthStateHandlers";
import { debounce } from "lodash";

// Global cache to prevent multiple initializations
let cachedSession: Session | null = null;
let globalInitializationPromise: Promise<void> | null = null;

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(cachedSession);
  const [loading, setLoading] = useState(!cachedSession);
  const { toast } = useToast();
  const mountedRef = useRef(true);

  const { initializeSession } = useSessionInitialization(
    (newSession) => {
      if (mountedRef.current) {
        setSession(newSession);
        cachedSession = newSession;
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
        cachedSession = newSession;
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

  const debouncedAuthStateChange = useCallback(
    debounce(async (event: string, currentSession: Session | null) => {
      if (!mountedRef.current) return;

      console.log("[Auth] Processing state change:", event, {
        hasSession: !!currentSession,
        user: currentSession?.user?.email
      });

      if (event === 'SIGNED_IN') {
        onSignIn(currentSession!);
        setupRefreshTimer(currentSession!);
      } else if (event === 'SIGNED_OUT') {
        onSignOut();
        cachedSession = null;
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        onTokenRefresh(currentSession);
        setupRefreshTimer(currentSession);
      }
    }, 500),
    [onSignIn, onSignOut, onTokenRefresh, setupRefreshTimer]
  );

  useEffect(() => {
    mountedRef.current = true;
    let refreshTimer: NodeJS.Timeout | null = null;

    const initialize = async () => {
      if (!mountedRef.current) return;

      if (!globalInitializationPromise) {
        console.log("[Auth] Starting new session initialization");
        globalInitializationPromise = initializeSession(true);
      } else {
        console.log("[Auth] Using existing initialization promise");
      }

      try {
        await globalInitializationPromise;
        if (mountedRef.current && session) {
          refreshTimer = setupRefreshTimer(session);
        }
      } catch (error) {
        console.error("[Auth] Initialization error:", error);
        globalInitializationPromise = null;
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