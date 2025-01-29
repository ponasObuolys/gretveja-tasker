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
const AUTO_RELOAD_DELAY = 500;
const SESSION_CHECK_INTERVAL = 100;
const MAX_SESSION_CHECKS = 10;

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
  const navigationAttempted = useRef(false);
  const processingAuth = useRef(false);
  const retryCount = useRef(0);
  const sessionCheckCount = useRef(0);
  const mountedRef = useRef(true);
  const authState = useAuthStateMachine();

  useEffect(() => {
    console.log("Auth callback mounted");
    mountedRef.current = true;
    let sessionCheckInterval: NodeJS.Timeout;
    let errorRedirectTimeout: NodeJS.Timeout;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
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

        // Initial session check
        let session = await checkSession();

        if (!session) {
          // Start polling for session
          sessionCheckInterval = setInterval(async () => {
            if (sessionCheckCount.current >= MAX_SESSION_CHECKS) {
              clearInterval(sessionCheckInterval);
              throw new Error(translations.invalidSession);
            }

            session = await checkSession();
            sessionCheckCount.current++;

            if (session) {
              clearInterval(sessionCheckInterval);
              console.log("Session established");
              
              if (mountedRef.current && !navigationAttempted.current) {
                navigationAttempted.current = true;
                authState.setState('AUTHENTICATED');
                
                // Force reload to ensure clean state
                console.log("Reloading application");
                window.location.href = '/';
              }
            }
          }, SESSION_CHECK_INTERVAL);
        } else {
          if (mountedRef.current && !navigationAttempted.current) {
            navigationAttempted.current = true;
            authState.setState('AUTHENTICATED');
            
            // Force reload to ensure clean state
            console.log("Reloading application");
            window.location.href = '/';
          }
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
      clearInterval(sessionCheckInterval);
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