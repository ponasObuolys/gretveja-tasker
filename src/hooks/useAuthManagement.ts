import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

interface UseAuthManagementProps {
  queryClient: QueryClient;
}

export const useAuthManagement = ({ queryClient }: UseAuthManagementProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNetworkError = (message: string) => {
    console.error("Network error:", message);
    toast({
      title: "Tinklo klaida",
      description: "Nepavyko prisijungti prie serverio. Patikrinkite interneto ryšį ir bandykite dar kartą.",
      variant: "destructive",
    });
  };

  const handleAuthError = (message: string) => {
    console.error("Auth error:", message);
    toast({
      title: "Prisijungimo klaida",
      description: "Nepavyko gauti sesijos. Bandykite dar kartą.",
      variant: "destructive",
    });
  };

  const clearAuthData = async () => {
    console.log("Clearing auth data");
    queryClient.clear();
    localStorage.removeItem('supabase.auth.token');
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const initializeAuth = async () => {
    console.log("Initializing auth");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting initial session:", sessionError);
        if (sessionError.message.includes('Failed to fetch')) {
          handleNetworkError(sessionError.message);
        } else {
          handleAuthError(sessionError.message);
        }
        await clearAuthData();
        return;
      }

      if (!session) {
        console.log("No initial session found");
        navigate("/auth");
        return;
      }

      const { data: refreshResult, error: refreshError } = 
        await supabase.auth.refreshSession();
        
      if (refreshError) {
        console.error("Session refresh error:", refreshError);
        if (refreshError.message.includes('Failed to fetch')) {
          handleNetworkError(refreshError.message);
        } else {
          handleAuthError(refreshError.message);
        }
        await clearAuthData();
        return;
      }

      console.log("Session initialized successfully:", {
        user: session.user.email,
        expiresAt: session.expires_at
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      toast({
        title: "Prisijungimo klaida",
        description: "Nepavyko prisijungti prie serverio. Bandykite dar kartą.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const setupAuthListener = () => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, {
        hasSession: !!session,
        user: session?.user?.email
      });

      if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out or session expired");
        await clearAuthData();
        toast({
          title: "Sesija pasibaigė",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
        navigate("/auth");
      }
    });
  };

  return {
    initializeAuth,
    setupAuthListener,
  };
};