import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from "@supabase/supabase-js";
import { getErrorMessage } from "@/utils/auth-error-handler";

export const useAuthFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormReady, setIsFormReady] = useState(false);

  const checkSession = async (mounted: boolean) => {
    try {
      console.log("Checking for existing session");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session check error:", sessionError);
        if (mounted) {
          setError(getErrorMessage(sessionError));
          setIsLoading(false);
        }
        return;
      }

      if (session?.user) {
        console.log("Active session found, redirecting to home");
        navigate("/");
        return;
      }

      console.log("No active session found");
      if (mounted) {
        setIsLoading(false);
        setIsFormReady(true);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      if (mounted) {
        setError(error instanceof AuthError ? getErrorMessage(error) : "Sesijos patikrinimo klaida");
        setIsLoading(false);
      }
    }
  };

  const handleAuthChange = async (event: string, session: any) => {
    console.log("Auth state changed:", event, {
      hasSession: !!session,
      userEmail: session?.user?.email,
      currentPath: window.location.pathname
    });

    if (event === "SIGNED_IN" && session?.user) {
      try {
        toast({
          title: "Sėkmingai prisijungta",
          description: "Nukreipiama į pagrindinį puslapį..."
        });
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError("Profilio gavimo klaida");
      }
    } else if (event === "SIGNED_OUT") {
      console.log("User signed out, ensuring clean state");
      setError(null);
      setIsFormReady(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Auth component mounted");
    let mounted = true;

    checkSession(mounted);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      mounted = false;
      console.log("Auth component unmounting, cleaning up subscription");
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return {
    error,
    isLoading,
    isFormReady
  };
};