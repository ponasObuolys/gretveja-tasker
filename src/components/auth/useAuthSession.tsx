import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

interface AuthStateChangeHandlers {
  onSignIn: (currentSession: Session) => void;
  onSignOut: () => void;
  onTokenRefresh: (currentSession: Session | null) => void;
}

/**
 * Custom hook to manage authentication session state
 * Handles session initialization, auth state changes, and error notifications
 */
export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  /**
   * Handles session initialization errors
   */
  const handleSessionError = (error: Error, mounted: boolean) => {
    console.error("Session initialization error:", error);
    if (mounted) {
      setSession(null);
      setLoading(false);
      toast({
        title: "Sesijos klaida",
        description: "Prašome prisijungti iš naujo",
        variant: "destructive",
      });
    }
  };

  /**
   * Initializes the session state
   */
  const initializeSession = async (mounted: boolean) => {
    try {
      console.log("Initializing session in useAuthSession");
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        throw sessionError;
      }

      if (mounted) {
        if (!currentSession) {
          console.log("No active session found");
          setSession(null);
        } else {
          console.log("Active session found:", {
            user: currentSession.user.email,
            expiresAt: currentSession.expires_at
          });
          setSession(currentSession);
        }
        setLoading(false);
      }
    } catch (error) {
      handleSessionError(error as Error, mounted);
    }
  };

  /**
   * Creates handlers for different auth state changes
   */
  const createAuthStateHandlers = (): AuthStateChangeHandlers => ({
    onSignIn: (currentSession: Session) => {
      setSession(currentSession);
      setLoading(false);
      toast({
        title: "Prisijungta",
        description: "Sėkmingai prisijungėte prie sistemos",
      });
    },
    onSignOut: () => {
      console.log("User signed out, clearing session");
      setSession(null);
      setLoading(false);
    },
    onTokenRefresh: (currentSession: Session | null) => {
      if (!currentSession) {
        console.log("No session after token refresh");
        setSession(null);
        setLoading(false);
        toast({
          title: "Sesija pasibaigė",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
      } else {
        console.log("Session refreshed successfully");
        setSession(currentSession);
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    let mounted = true;

    // Set up auth state change handlers
    const handlers = createAuthStateHandlers();

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
  }, [toast]);

  return { session, loading };
};