import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionInitialization } from "@/hooks/auth/useSessionInitialization";
import { useAuthStateHandlers } from "@/hooks/auth/useAuthStateHandlers";
import { debounce } from "lodash";

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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
      console.log(`Scheduling token refresh in ${refreshTime / 1000} seconds`);
      
      return setTimeout(() => {
        console.log("Executing scheduled token refresh");
        supabase.auth.refreshSession();
      }, refreshTime);
    }
    return null;
  }, []);

  // Debounce auth state changes with a longer delay
  const debouncedAuthStateChange = useCallback(
    debounce(async (event: string, currentSession: Session | null) => {
      console.log("Processing auth state change:", event, {
        hasSession: !!currentSession,
        user: currentSession?.user?.email
      });

      if (event === 'SIGNED_IN') {
        onSignIn(currentSession!);
        setupRefreshTimer(currentSession!);
      } else if (event === 'SIGNED_OUT') {
        onSignOut();
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        onTokenRefresh(currentSession);
        setupRefreshTimer(currentSession);
      }
    }, 500), // Increased debounce delay to 500ms
    [onSignIn, onSignOut, onTokenRefresh, setupRefreshTimer]
  );

  useEffect(() => {
    let mounted = true;
    let refreshTimer: NodeJS.Timeout | null = null;

    const initialize = async () => {
      if (!mounted) return;
      await initializeSession(mounted);
      
      if (mounted && session) {
        refreshTimer = setupRefreshTimer(session);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email,
          currentPath: window.location.pathname
        });

        debouncedAuthStateChange(event, currentSession);
      }
    );

    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      debouncedAuthStateChange.cancel();
      if (refreshTimer) clearTimeout(refreshTimer);
      console.log("Cleaning up auth subscription in useAuthSession");
      subscription.unsubscribe();
    };
  }, [toast, debouncedAuthStateChange, initializeSession, session, setupRefreshTimer]);

  return { session, loading };
};