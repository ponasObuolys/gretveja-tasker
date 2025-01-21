import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthContainer } from "@/components/auth/AuthContainer";

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Processing auth callback");
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error in callback:", sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log(`No session found in callback, attempt ${retryCount + 1} of ${maxRetries}`);
          
          if (retryCount < maxRetries) {
            retryCount++;
            // Wait for 1 second before retrying
            setTimeout(handleAuthCallback, 1000);
            return;
          }
          
          throw new Error("Nepavyko prisijungti. Bandykite dar kartą.");
        }

        console.log("Auth callback successful, session found for:", session.user.email);
        
        if (mounted) {
          console.log("Redirecting to home after successful auth");
          navigate("/");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        if (mounted) {
          setError(error instanceof Error ? error.message : "Prisijungimo klaida");
          setTimeout(() => mounted && navigate("/auth"), 2000);
        }
      }
    };

    handleAuthCallback();

    return () => {
      mounted = false;
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