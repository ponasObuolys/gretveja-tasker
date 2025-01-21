import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createAuthStateHandlers } from "@/utils/auth/session-handlers";
import { initializeSession } from "@/utils/auth/session-initialization";

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

/**
 * Custom hook for managing authentication session state
 * 
 * Handles:
 * - Session initialization
 * - Auth state changes (sign in, sign out, token refresh)
 * - Error handling with retry mechanism
 * - Loading states
 * 
 * @returns {UseAuthSessionResult} Object containing session and loading state
 */
export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const handlers = createAuthStateHandlers(setSession, setLoading, toast);

    // Initialize session
    initializeSession(mounted, setSession, setLoading, toast);

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
            await handlers.onTokenRefresh(currentSession);
            break;
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [toast]);

  return { session, loading };
};