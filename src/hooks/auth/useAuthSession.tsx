import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionInitialization } from "@/hooks/auth/useSessionInitialization";
import { useAuthStateHandlers } from "@/hooks/auth/useAuthStateHandlers";
import { debounce } from "lodash";

// Session cache
const SESSION_CACHE_KEY = 'auth_session_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 300;

// Singleton for auth subscription
let globalAuthSubscription: { unsubscribe: () => void } | null = null;
let subscriberCount = 0;

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(() => {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const { toast } = useToast();

  const { initializeSession } = useSessionInitialization(setSession, setLoading);
  const { onSignIn, onSignOut, onTokenRefresh } = useAuthStateHandlers(setSession, setLoading);

  const setupRefreshTimer = useCallback((currentSession: Session) => {
    if (!currentSession?.expires_at) return;

    const expiresAt = new Date(currentSession.expires_at * 1000);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    if (timeUntilExpiry > refreshBuffer) {
      const refreshTime = timeUntilExpiry - refreshBuffer;
      const timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          supabase.auth.refreshSession();
        }
      }, refreshTime);

      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Debounce auth state changes to prevent rapid updates
  const debouncedAuthStateChange = useCallback(
    debounce(async (event: string, currentSession: Session | null) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN') {
        onSignIn(currentSession!);
        setupRefreshTimer(currentSession!);
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(currentSession));
      } else if (event === 'SIGNED_OUT') {
        onSignOut();
        localStorage.removeItem(SESSION_CACHE_KEY);
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        onTokenRefresh(currentSession);
        setupRefreshTimer(currentSession);
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(currentSession));
      }
    }, DEBOUNCE_DELAY),
    [onSignIn, onSignOut, onTokenRefresh, setupRefreshTimer]
  );

  useEffect(() => {
    mountedRef.current = true;
    subscriberCount++;

    const initAuth = async () => {
      const cachedSession = localStorage.getItem(SESSION_CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(SESSION_CACHE_KEY + '_timestamp');
      
      if (cachedSession && cacheTimestamp) {
        const cacheAge = Date.now() - Number(cacheTimestamp);
        if (cacheAge < CACHE_DURATION) {
          setSession(JSON.parse(cachedSession));
          setLoading(false);
          return;
        }
      }

      await initializeSession(true);
    };

    // Use singleton pattern for auth subscription
    if (!globalAuthSubscription) {
      globalAuthSubscription = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!mountedRef.current) return;
          debouncedAuthStateChange(event, currentSession);
        }
      ).data.subscription;
    }

    initAuth();

    return () => {
      mountedRef.current = false;
      debouncedAuthStateChange.cancel();
      
      subscriberCount--;
      if (subscriberCount === 0 && globalAuthSubscription) {
        globalAuthSubscription.unsubscribe();
        globalAuthSubscription = null;
      }
    };
  }, [debouncedAuthStateChange, initializeSession]);

  return { session, loading };
};