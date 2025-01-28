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

  const initSession = useSessionInitialization(setSession, setLoading);
  const { onSignIn, onSignOut, onTokenRefresh } = useAuthStateHandlers(setSession, setLoading);

  const setupRefreshTimer = useCallback((currentSession: Session) => {
    if (!currentSession?.expires_at) return;

    const expiresAt = new Date(currentSession.expires_at * 1000);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    // Only schedule refresh if expiry is more than buffer time away
    if (timeUntilExpiry > refreshBuffer) {
      const refreshTime = timeUntilExpiry - refreshBuffer;
      console.log(`Scheduling token refresh in ${refreshTime / 1000} seconds`);
      
      setTimeout(() => {
        console.log("Executing scheduled token refresh");
        supabase.auth.refreshSession();
      }, refreshTime);
    }
  }, []);

  // Debounce auth state changes to prevent rapid updates
  const debouncedAuthStateChange = useCallback(
    debounce(async (event: string, currentSession: Session | null) => {
      console.log("Debounced auth state change:", event, {
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
    }, 300),
    [onSignIn, onSignOut, onTokenRefresh, setupRefreshTimer]
  );

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email,
          currentPath: window.location.pathname
        });

        if (!mounted) return;
        debouncedAuthStateChange(event, currentSession);
      }
    );

    initSession(mounted);

    return () => {
      mounted = false;
      debouncedAuthStateChange.cancel();
      console.log("Cleaning up auth subscription in useAuthSession");
      subscription.unsubscribe();
    };
  }, [toast, debouncedAuthStateChange, initSession]);

  return { session, loading };
};