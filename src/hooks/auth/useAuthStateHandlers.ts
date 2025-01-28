import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

interface AuthStateHandlers {
  onSignIn: (currentSession: Session) => void;
  onSignOut: () => void;
  onTokenRefresh: (currentSession: Session | null) => void;
}

// Keep track of auth state to prevent duplicate notifications
let lastAuthState: {
  type: 'signin' | 'signout' | 'refresh' | null;
  timestamp: number;
  userId: string | null;
} = {
  type: null,
  timestamp: 0,
  userId: null
};

const AUTH_STATE_THRESHOLD = 2000; // 2 seconds threshold for duplicate events

export const useAuthStateHandlers = (
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void
): AuthStateHandlers => {
  const { toast } = useToast();

  const shouldProcessAuthEvent = useCallback((
    type: 'signin' | 'signout' | 'refresh',
    userId: string | null
  ): boolean => {
    const now = Date.now();
    
    // Prevent duplicate events within threshold
    if (
      lastAuthState.type === type &&
      lastAuthState.userId === userId &&
      now - lastAuthState.timestamp < AUTH_STATE_THRESHOLD
    ) {
      console.log(`Skipping duplicate ${type} event`);
      return false;
    }

    lastAuthState = { type, timestamp: now, userId };
    return true;
  }, []);

  const onSignIn = useCallback((currentSession: Session) => {
    if (!shouldProcessAuthEvent('signin', currentSession.user.id)) return;

    console.log("Processing sign in:", currentSession.user.email);
    setSession(currentSession);
    setLoading(false);
    toast({
      title: "Prisijungta",
      description: "Sėkmingai prisijungėte prie sistemos",
    });
  }, [setSession, setLoading, toast, shouldProcessAuthEvent]);

  const onSignOut = useCallback(() => {
    if (!shouldProcessAuthEvent('signout', null)) return;

    console.log("Processing sign out");
    setSession(null);
    setLoading(false);
  }, [setSession, setLoading, shouldProcessAuthEvent]);

  const onTokenRefresh = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      if (shouldProcessAuthEvent('signout', null)) {
        console.log("No session after token refresh");
        setSession(null);
        setLoading(false);
        toast({
          title: "Sesija pasibaigė",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
      }
    } else {
      if (shouldProcessAuthEvent('refresh', currentSession.user.id)) {
        console.log("Session refreshed successfully");
        setSession(currentSession);
        setLoading(false);
      }
    }
  }, [setSession, setLoading, toast, shouldProcessAuthEvent]);

  return {
    onSignIn,
    onSignOut,
    onTokenRefresh
  };
};