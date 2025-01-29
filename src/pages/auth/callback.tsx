import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { useAuthStateMachine } from "@/hooks/auth/useAuthStateMachine";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import * as Sentry from "@sentry/react";

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const ERROR_REDIRECT_DELAY = 2000;

// Lithuanian translations
const translations = {
  pleaseWait: "Prašome palaukti...",
  processingAuth: "Apdorojama autentifikacija...",
  invalidSession: "Netinkama sesija. Prašome prisijungti iš naujo.",
  authError: "Įvyko autentifikacijos klaida",
  maxRetries: "Viršytas maksimalus bandymų skaičius",
  tryAgain: "Bandykite dar kartą",
};

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navigationAttempted = useRef(false);
  const processingAuth = useRef(false);
  const retryCount = useRef(0);
  const mountedRef = useRef(true);
  const authState = useAuthStateMachine();

  useEffect(() => {
    console.log("Processing auth callback");
    mountedRef.current = true;
    let navigationTimeout: NodeJS.Timeout;

    const handleAuthCallback = async () => {
      // Prevent multiple simultaneous auth processing attempts
      if (processingAuth.current) {
        console.log("Auth processing already in progress");
        return;
      }

      processingAuth.current = true;
      authState.setState('INITIALIZING');

      try {
        // Check for error in URL parameters
        const params = new URLSearchParams(location.search);
        const errorCode = params.get("error");
        const errorDescription = params.get("error_description");

        if (errorCode) {
          throw new Error(errorDescription || `${translations.authError}: ${errorCode}`);
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error in callback:", sessionError);
          if (sessionError.status === 400) {
            setError(translations.invalidSession);
            if (mountedRef.current && !navigationAttempted.current) {
              navigationAttempted.current = true;
              navigate("/auth", { replace: true });
            }
            return;
          }
          throw sessionError;
        }

        if (!session) {
          if (retryCount.current < MAX_RETRIES) {
            console.log(`No session found in callback, attempting retry ${retryCount.current + 1}/${MAX_RETRIES}`);
            retryCount.current++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            const { data: { session: retrySession }, error: retryError } = 
              await supabase.auth.getSession();
            
            if (retryError || !retrySession) {
              throw new Error(translations.maxRetries);
            }
          } else {
            throw new Error(translations.maxRetries);
          }
        }

        if (mountedRef.current && !navigationAttempted.current) {
          console.log("Auth callback successful, navigating to home");
          navigationAttempted.current = true;
          authState.setState('AUTHENTICATED');
          
          // Get return URL from localStorage or default to home
          const returnUrl = localStorage.getItem("auth_return_url") || "/";
          localStorage.removeItem("auth_return_url"); // Clean up
          navigate(returnUrl, { replace: true });
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        Sentry.captureException(error);
        authState.setState('ERROR');
        
        if (mountedRef.current) {
          setError(error instanceof Error ? error.message : translations.authError);
          // Navigate to auth page after error
          if (!navigationAttempted.current) {
            navigationTimeout = setTimeout(() => {
              if (mountedRef.current && !navigationAttempted.current) {
                navigationAttempted.current = true;
                navigate("/auth", { replace: true });
              }
            }, ERROR_REDIRECT_DELAY);
          }
        }
      } finally {
        processingAuth.current = false;
      }
    };

    handleAuthCallback();

    return () => {
      mountedRef.current = false;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [navigate, location, authState]);

  return (
    <AuthContainer>
      {error ? (
        <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10">
          <AlertDescription className="text-red-400">
            {error}
            <button
              onClick={() => navigate("/auth", { replace: true })}
              className="ml-2 text-sm underline hover:text-red-300"
            >
              {translations.tryAgain}
            </button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-muted-foreground">{translations.pleaseWait}</p>
            <p className="text-sm text-muted-foreground/70">{translations.processingAuth}</p>
          </div>
        </div>
      )}
    </AuthContainer>
  );
};

export default AuthCallback;