import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Toast } from "@/hooks/use-toast";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

export const handleSessionError = async (
  error: Error, 
  mounted: boolean, 
  retryCount = 0,
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void,
  toast: Toast
) => {
  console.error("Session error:", error, "Retry count:", retryCount);
  
  if (!mounted) return;

  if (retryCount < MAX_RETRIES) {
    const delay = RETRY_DELAY * Math.pow(2, retryCount);
    console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return true;
  }

  setSession(null);
  setLoading(false);
  toast({
    title: "Sesijos klaida",
    description: "Prašome prisijungti iš naujo",
    variant: "destructive",
  });
  return false;
};

export const initializeSession = async (
  mounted: boolean,
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void,
  toast: Toast,
  retryCount = 0
) => {
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
    const shouldRetry = await handleSessionError(
      error as Error, 
      mounted, 
      retryCount,
      setSession,
      setLoading,
      toast
    );
    if (shouldRetry && mounted) {
      await initializeSession(mounted, setSession, setLoading, toast, retryCount + 1);
    }
  }
};