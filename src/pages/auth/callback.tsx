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

    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Auth callback error:", sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log("No session found in callback");
          throw new Error("Nepavyko prisijungti. Bandykite dar kartą.");
        }

        if (mounted) {
          console.log("Auth callback successful, redirecting to home");
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