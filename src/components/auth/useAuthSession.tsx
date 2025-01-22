import { useState, useEffect, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionInitialization } from "@/hooks/auth/useSessionInitialization";
import { useAuthStateHandlers } from "@/hooks/auth/useAuthStateHandlers";

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

    if (timeUntilExpiry <= refreshBuffer) {
      console.log("Token close to expiry, refreshing now");
      supabase.auth.refreshSession();
    } else {
      const refreshTime = timeUntilExpiry - refreshBuffer;
      console.log(`Scheduling token refresh in ${refreshTime / 1000} seconds`);
      
      setTimeout(() => {
        console.log("Executing scheduled token refresh");
        supabase.auth.refreshSession();
      }, refreshTime);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email
        });

        if (!mounted) return;

        if (event === 'SIGNED_IN') {
          onSignIn(currentSession!);
          setupRefreshTimer(currentSession!);
        } else if (event === 'SIGNED_OUT') {
          onSignOut();
        } else if (event === 'TOKEN_REFRESHED') {
          onTokenRefresh(currentSession);
          if (currentSession) {
            setupRefreshTimer(currentSession);
          }
        }
      }
    );

    initializeSession(mounted);

    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription in useAuthSession");
      subscription.unsubscribe();
    };
  }, [toast, setupRefreshTimer]);

  return { session, loading };
};