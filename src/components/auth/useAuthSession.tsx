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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleSessionError = async (error: Error, mounted: boolean, retryCount = 0) => {
    console.error("Session error:", error, "Retry count:", retryCount);
    
    if (!mounted) return;

    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return true; // indicate should retry
    }

    setSession(null);
    setLoading(false);
    toast({
      title: "Sesijos klaida",
      description: "Prašome prisijungti iš naujo",
      variant: "destructive",
    });
    return false; // indicate should not retry
  };

  const initializeSession = async (mounted: boolean, retryCount = 0) => {
    try {
      console.log(`Initializing session (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        throw sessionError;
      }

      if (!mounted) return;

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
      
    } catch (error) {
      const shouldRetry = await handleSessionError(error as Error, mounted, retryCount);
      if (shouldRetry && mounted) {
        await initializeSession(mounted, retryCount + 1);
      }
    }
  };

  const createAuthStateHandlers = (): AuthStateChangeHandlers => ({
    onSignIn: (currentSession: Session) => {
      console.log("User signed in:", currentSession.user.email);
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
    onTokenRefresh: async (currentSession: Session | null) => {
      if (!currentSession) {
        console.log("No session after token refresh");
        setSession(null);
        setLoading(false);
        toast({
          title: "Sesija pasibaigė",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log("Refreshing session token");
        const { data: refreshResult, error: refreshError } = 
          await supabase.auth.refreshSession();
          
        if (refreshError) throw refreshError;
        
        console.log("Session refreshed successfully");
        setSession(refreshResult.session);
        setLoading(false);
      } catch (error) {
        console.error("Token refresh error:", error);
        setSession(null);
        setLoading(false);
        toast({
          title: "Sesijos atnaujinimo klaida",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
      }
    }
  });

  useEffect(() => {
    let mounted = true;
    const handlers = createAuthStateHandlers();

    initializeSession(mounted);

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

    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [toast]);

  return { session, loading };
};