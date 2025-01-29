import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { useAuthStateMachine } from "@/hooks/auth/useAuthStateMachine";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import * as Sentry from "@sentry/react";

const MAX_RETRIES = 3;
const RETRY_DELAY = 500;
const ERROR_REDIRECT_DELAY = 2000;
const SESSION_CHECK_INTERVAL = 100;

// Lithuanian translations
const translations = {
  pleaseWait: "Prašome palaukti...",
  processingAuth: "Apdorojama autentifikacija...",
  invalidSession: "Netinkama sesija. Prašome prisijungti iš naujo.",
  authError: "Įvyko autentifikacijos klaida",
  maxRetries: "Viršytas maksimalus bandymų skaičius",
  tryAgain: "Bandykite dar kartą",
  sessionExpired: "Sesija pasibaigė",
};

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const processingAuth = useRef(false);
  const retryCount = useRef(0);
  const mountedRef = useRef(true);
  const authState = useAuthStateMachine();

  useEffect(() => {
    console.log("Auth callback mounted, starting session refresh");
    mountedRef.current = true;
    let errorRedirectTimeout: NodeJS.Timeout;

    const refreshSession = async () => {
      try {
        // Force session refresh
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        return session;
      } catch (error) {
        console.error("Session refresh error:", error);
        return null;
      }
    };

    const handleAuthCallback = async () => {
      if (processingAuth.current) {
        console.log("Auth processing already in progress");
        return;
      }

      processingAuth.current = true;
      authState.setState('INITIALIZING');

      try {
        const params = new URLSearchParams(location.search);
        const errorCode = params.get("error");
        const errorDescription = params.get("error_description");

        if (errorCode) {
          throw new Error(errorDescription || `${translations.authError}: ${errorCode}`);
        }

        // Try to refresh session
        let session = await refreshSession();

        if (!session && retryCount.current < MAX_RETRIES) {
          console.log(`Retry attempt ${retryCount.current + 1}/${MAX_RETRIES}`);
          retryCount.current++;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          // Try to get session again
          session = await refreshSession();
        }

        if (!session) {
          throw new Error(translations.invalidSession);
        }

        if (mountedRef.current) {
          console.log("Session refreshed successfully, updating state");
          authState.setState('AUTHENTICATED');
          
          // Force page reload to reset auth state
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        Sentry.captureException(error);
        authState.setState('UNAUTHENTICATED');
        
        if (mountedRef.current) {
          setError(error instanceof Error ? error.message : translations.authError);
          errorRedirectTimeout = setTimeout(() => {
            if (mountedRef.current) {
              navigate('/auth/login');
            }
          }, ERROR_REDIRECT_DELAY);
        }
      } finally {
        processingAuth.current = false;
      }
    };

    handleAuthCallback();

    return () => {
      mountedRef.current = false;
      clearTimeout(errorRedirectTimeout);
    };
  }, [location.search, navigate, authState]);

  if (error) {
    return (
      <AuthContainer>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <div className="flex flex-col items-center justify-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{translations.processingAuth}</p>
      </div>
    </AuthContainer>
  );
};

export default AuthCallback;