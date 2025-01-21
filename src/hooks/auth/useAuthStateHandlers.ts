import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferencesStore } from "@/stores/userPreferencesStore";

interface AuthStateHandlers {
  onSignIn: (currentSession: Session) => void;
  onSignOut: () => void;
  onTokenRefresh: (currentSession: Session | null) => void;
}

export const useAuthStateHandlers = (
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void
): AuthStateHandlers => {
  const { toast } = useToast();
  const setPreferences = useUserPreferencesStore((state) => state.setPreferences);

  return {
    onSignIn: (currentSession: Session) => {
      setSession(currentSession);
      setLoading(false);
      setPreferences({
        email: currentSession.user.email,
        role: currentSession.user.role,
      });
      toast({
        title: "Prisijungta",
        description: "Sėkmingai prisijungėte prie sistemos",
      });
    },
    onSignOut: () => {
      console.log("User signed out, clearing session");
      setSession(null);
      setLoading(false);
      setPreferences({
        email: null,
        role: null,
      });
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
      } else {
        console.log("Session refreshed successfully");
        setSession(currentSession);
        setLoading(false);
      }
    }
  };
};