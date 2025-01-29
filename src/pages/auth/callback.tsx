import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthContainer } from "@/components/auth/AuthContainer";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const navigationAttempted = useRef(false);
  const processingAuth = useRef(false);

  useEffect(() => {
    console.log("Processing auth callback");
    let mounted = true;
    let navigationTimeout: NodeJS.Timeout;

    const handleAuthCallback = async () => {
      // Prevent multiple simultaneous auth processing attempts
      if (processingAuth.current) {
        console.log("Auth processing already in progress");
        return;
      }

      processingAuth.current = true;

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error in callback:", sessionError);
          if (sessionError.status === 400) {
            setError("Invalid session request. Please try logging in again.");
            navigate("/auth", { replace: true });
            return;
          }
          throw sessionError;
        }

        if (!session) {
          console.log("No session found in callback, attempting one retry");
          // Single retry after 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: { session: retrySession }, error: retryError } = 
            await supabase.auth.getSession();
          
          if (retryError || !retrySession) {
            throw new Error("Nepavyko prisijungti po pakartotinio bandymo");
          }
        }

        if (mounted && !navigationAttempted.current) {
          console.log("Auth callback successful, navigating to home");
          navigationAttempted.current = true;
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        if (mounted) {
          setError(error instanceof Error ? error.message : "Prisijungimo klaida");
          // Navigate to auth page after error
          navigationTimeout = setTimeout(() => {
            if (mounted && !navigationAttempted.current) {
              navigationAttempted.current = true;
              navigate("/auth", { replace: true });
            }
          }, 2000);
        }
      } finally {
        processingAuth.current = false;
      }
    };

    handleAuthCallback();

    return () => {
      mounted = false;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [navigate]);

  return (
    <AuthContainer>
      {error ? (
        <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10">
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Prašome palaukti...</p>
          </div>
        </div>
      )}
    </AuthContainer>
  );
};

export default AuthCallback;