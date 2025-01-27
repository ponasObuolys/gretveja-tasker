import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseSessionInitializationResult {
  initializeSession: (mounted: boolean) => Promise<void>;
  handleSessionError: (error: Error, mounted: boolean) => void;
}

const SESSION_CACHE_KEY = 'auth_session_cache';

export const useSessionInitialization = (
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void
): UseSessionInitializationResult => {
  const { toast } = useToast();

  const handleSessionError = (error: Error, mounted: boolean) => {
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

  const initializeSession = async (mounted: boolean) => {
    try {
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (mounted) {
        if (!currentSession) {
          setSession(null);
        } else {
          setSession(currentSession);
          localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(currentSession));
          localStorage.setItem(SESSION_CACHE_KEY + '_timestamp', Date.now().toString());
        }
        setLoading(false);
      }
    } catch (error) {
      handleSessionError(error as Error, mounted);
    }
  };

  return { initializeSession, handleSessionError };
};