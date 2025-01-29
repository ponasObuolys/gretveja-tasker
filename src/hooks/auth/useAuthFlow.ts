import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from "@supabase/supabase-js";
import { getErrorMessage } from "@/utils/auth-error-handler";

const MAX_LOADING_TIME = 5000; // 5 seconds

export const useAuthFlow = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormReady, setIsFormReady] = useState(false);
  const mountedRef = useRef(true);
  const initAttemptedRef = useRef(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  const clearLoadingState = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (mountedRef.current) {
      setIsLoading(false);
    }
  };

  const checkSession = async () => {
    if (!mountedRef.current || initAttemptedRef.current) return;

    try {
      console.log("Checking for existing session");
      initAttemptedRef.current = true;
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session check error:", sessionError);
        if (mountedRef.current) {
          setError(getErrorMessage(sessionError));
          clearLoadingState();
        }
        return;
      }

      if (session?.user) {
        console.log("Active session found, redirecting to home");
        if (mountedRef.current) {
          navigate("/");
        }
        return;
      }

      console.log("No active session found");
      if (mountedRef.current) {
        clearLoadingState();
        setIsFormReady(true);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      if (mountedRef.current) {
        setError(error instanceof AuthError ? getErrorMessage(error) : "Sesijos patikrinimo klaida");
        clearLoadingState();
      }
    }
  };

  const handleAuthChange = async (event: string, session: any) => {
    if (!mountedRef.current) return;

    console.log("Auth state changed:", event, {
      hasSession: !!session,
      userEmail: session?.user?.email,
      currentPath: window.location.pathname
    });

    if (event === "SIGNED_IN" && session?.user) {
      try {
        if (mountedRef.current) {
          toast({
            title: "Sėkmingai prisijungta",
            description: "Nukreipiama į pagrindinį puslapį..."
          });
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        if (mountedRef.current) {
          setError("Profilio gavimo klaida");
        }
      }
    } else if (event === "SIGNED_OUT") {
      console.log("User signed out, ensuring clean state");
      if (mountedRef.current) {
        setError(null);
        setIsFormReady(true);
        clearLoadingState();
      }
    }
  };

  useEffect(() => {
    console.log("Auth component mounted");
    mountedRef.current = true;
    initAttemptedRef.current = false;

    // Set loading timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.log("Auth loading timeout reached");
        clearLoadingState();
        setError("Prisijungimas užtrunka ilgiau nei įprasta. Bandykite dar kartą.");
      }
    }, MAX_LOADING_TIME);

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      console.log("Auth component unmounting, cleaning up");
      mountedRef.current = false;
      clearLoadingState();
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return {
    error,
    isLoading,
    isFormReady
  };
};