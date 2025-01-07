import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const refreshSession = async () => {
  console.log("Attempting to refresh session");
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.error("No session found during refresh:", error);
    await supabase.auth.signOut();
    return null;
  }

  const { data: refreshedSession, error: refreshError } = 
    await supabase.auth.refreshSession();

  if (refreshError) {
    console.error("Error refreshing session:", refreshError);
    await supabase.auth.signOut();
    return null;
  }

  console.log("Session refreshed successfully");
  return refreshedSession;
};

export const useSessionCheck = (navigate: (path: string) => void) => {
  const { toast } = useToast();

  return async () => {
    try {
      const session = await refreshSession();
      if (!session) {
        console.log("No valid session, redirecting to auth");
        toast({
          title: "Sesija pasibaigė",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
        navigate("/auth");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Session check error:", error);
      toast({
        title: "Klaida",
        description: "Įvyko klaida tikrinant sesiją",
        variant: "destructive",
      });
      navigate("/auth");
      return false;
    }
  };
};