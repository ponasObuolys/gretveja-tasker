import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import debounce from "lodash/debounce";

interface UseAuthManagementProps {
  queryClient: QueryClient;
}

export const useAuthManagement = ({ queryClient }: UseAuthManagementProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasAttemptedInitialAuth, setHasAttemptedInitialAuth] = useState(false);
  const retryAttemptsRef = useRef(0);
  const maxRetryAttempts = 3;
  const cooldownPeriod = 2000;
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

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
    setHasAttemptedInitialAuth(false);
    retryAttemptsRef.current = 0;
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const debouncedInitAuth = useCallback(
    debounce(async () => {
      if (isInitializing || retryAttemptsRef.current >= maxRetryAttempts) {
        console.log("Skipping auth initialization - already in progress or max retries reached");
        return;
      }

      setIsInitializing(true);
      console.log("Initializing auth - attempt", retryAttemptsRef.current + 1);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          retryAttemptsRef.current++;
          
          if (sessionError.message.includes('Failed to fetch')) {
            handleNetworkError(sessionError.message);
          } else {
            handleAuthError(sessionError.message);
          }
          
          if (retryAttemptsRef.current >= maxRetryAttempts) {
            console.log("Max retry attempts reached");
            await clearAuthData();
          } else {
            setTimeout(() => debouncedInitAuth(), cooldownPeriod * Math.pow(2, retryAttemptsRef.current));
          }
          return;
        }

        if (!session) {
          console.log("No initial session found");
          setHasAttemptedInitialAuth(true);
          navigate("/auth");
          return;
        }

        const { data: refreshResult, error: refreshError } = 
          await supabase.auth.refreshSession();
          
        if (refreshError) {
          console.error("Session refresh error:", refreshError);
          retryAttemptsRef.current++;
          
          if (refreshError.message.includes('Failed to fetch')) {
            handleNetworkError(refreshError.message);
          } else {
            handleAuthError(refreshError.message);
          }
          
          if (retryAttemptsRef.current >= maxRetryAttempts) {
            await clearAuthData();
          } else {
            setTimeout(() => debouncedInitAuth(), cooldownPeriod * Math.pow(2, retryAttemptsRef.current));
          }
          return;
        }

        setHasAttemptedInitialAuth(true);
        retryAttemptsRef.current = 0;
        console.log("Session initialized successfully:", {
          user: session.user.email,
          expiresAt: session.expires_at
        });
      } catch (error) {
        console.error("Auth initialization error:", error);
        retryAttemptsRef.current++;
        
        toast({
          title: "Prisijungimo klaida",
          description: "Nepavyko prisijungti prie serverio. Bandykite dar kartą.",
          variant: "destructive",
        });
        
        if (retryAttemptsRef.current >= maxRetryAttempts) {
          navigate("/auth");
        } else {
          setTimeout(() => debouncedInitAuth(), cooldownPeriod * Math.pow(2, retryAttemptsRef.current));
        }
      } finally {
        setIsInitializing(false);
      }
    }, 500),
    [navigate, toast]
  );

  const initializeAuth = useCallback(async () => {
    debouncedInitAuth();
  }, [debouncedInitAuth]);

  const setupAuthListener = useCallback(() => {
    if (authSubscriptionRef.current) {
      authSubscriptionRef.current.unsubscribe();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, {
        hasSession: !!session,
        user: session?.user?.email
      });

      if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out or session expired");
        await clearAuthData();
      }
    });

    authSubscriptionRef.current = subscription;
    return { data: { subscription } };
  }, []);

  return {
    initializeAuth,
    setupAuthListener,
    isInitializing,
    hasAttemptedInitialAuth,
    clearAuthData
  };
};