import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

interface UseAuthManagementProps {
  queryClient: QueryClient;
}

const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;

export const useAuthManagement = ({ queryClient }: UseAuthManagementProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuthError = async (error: Error, attempt: number = 0) => {
    console.error(`Auth error on attempt ${attempt + 1}:`, error);
    
    if (attempt >= MAX_RETRIES) {
      console.error("Max retries reached, clearing auth state");
      await clearAuthData();
      return false;
    }

    const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
    console.log(`Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return true;
  };

  const clearAuthData = async () => {
    console.log("Clearing auth data and redirecting to auth page");
    queryClient.clear();
    localStorage.removeItem('supabase.auth.token');
    await supabase.auth.signOut();
    navigate("/auth");
    
    toast({
      title: "Sesijos klaida",
      description: "Prašome prisijungti iš naujo",
      variant: "destructive",
    });
  };

  const initializeAuth = async () => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to initialize auth (attempt ${attempt + 1})`);
        
        const { data: { session }, error: sessionError } = 
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log("No session found, redirecting to auth");
          navigate("/auth");
          return;
        }

        const { data: refreshResult, error: refreshError } = 
          await supabase.auth.refreshSession();
          
        if (refreshError) {
          console.error("Session refresh error:", refreshError);
          throw refreshError;
        }

        console.log("Auth initialized successfully:", {
          user: session.user.email,
          expiresAt: session.expires_at
        });
        
        return;
      } catch (error) {
        const shouldRetry = await handleAuthError(error as Error, attempt);
        if (!shouldRetry) break;
      }
    }
  };

  const setupAuthListener = () => {
    console.log("Setting up auth state listener");
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, {
        hasSession: !!session,
        user: session?.user?.email
      });

      if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out or session expired");
        await clearAuthData();
      }
    });
  };

  return {
    initializeAuth,
    setupAuthListener,
  };
};