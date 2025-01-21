import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionInitialization } from "@/hooks/auth/useSessionInitialization";
import { useAuthStateHandlers } from "@/hooks/auth/useAuthStateHandlers";
import { useAuthStore } from "@/stores/authStore";

/**
 * Custom hook to manage authentication session state
 * Handles session initialization, auth state changes, and error notifications
 */
export const useAuthSession = () => {
  const { setSession, setLoading } = useAuthStore();
  const { initializeSession } = useSessionInitialization(setSession, setLoading);
  const handlers = useAuthStateHandlers(setSession, setLoading);

  useEffect(() => {
    let mounted = true;

    // Initialize session
    initializeSession(mounted);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email
        });

        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            handlers.onSignIn(currentSession!);
            break;
          case 'SIGNED_OUT':
            handlers.onSignOut();
            break;
          case 'TOKEN_REFRESHED':
            handlers.onTokenRefresh(currentSession);
            break;
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription in useAuthSession");
      subscription.unsubscribe();
    };
  }, []);

  return useAuthStore();
};