import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Toast } from "@/hooks/use-toast";

export interface AuthStateChangeHandlers {
  onSignIn: (currentSession: Session) => void;
  onSignOut: () => void;
  onTokenRefresh: (currentSession: Session | null) => void;
}

export const createAuthStateHandlers = (
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void,
  toast: Toast
): AuthStateChangeHandlers => ({
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