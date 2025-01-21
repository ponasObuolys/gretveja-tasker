import { useEffect, useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AuthError } from "@supabase/supabase-js";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { getErrorMessage } from "@/utils/auth-error-handler";
import { authLocalization } from "@/config/auth-localization";
import { authAppearance } from "@/config/auth-appearance";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormReady, setIsFormReady] = useState(false);

  useEffect(() => {
    console.log("Auth component mounted");
    let mounted = true;

    const checkSession = async () => {
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

    const clearStaleSession = async () => {
      try {
        console.log("Clearing stale session");
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
      } catch (error) {
        console.error("Error clearing stale session:", error);
      }
    };

    clearStaleSession().then(() => checkSession());

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, {
        hasSession: !!session,
        userEmail: session?.user?.email
      });
      
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) throw profileError;

          toast({
            title: "Sėkmingai prisijungta",
            description: profile?.role === "ADMIN" ? 
              "Sveiki sugrįžę, administratoriau!" : 
              "Sveiki sugrįžę!"
          });

          navigate("/");
        } catch (error) {
          console.error("Profile fetch error:", error);
          setError("Profilio gavimo klaida");
        }
      }
    });

    return () => {
      mounted = false;
      console.log("Auth component unmounting");
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <AuthContainer>
        <div className="flex items-center justify-center">
          <span className="text-gray-400">Kraunama...</span>
        </div>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      {error && (
        <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10">
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {isFormReady && (
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={authAppearance}
          localization={{ variables: authLocalization.variables }}
          providers={[]}
          view="sign_in"
          showLinks={false}
          otpType="email"
          magicLink={false}
          redirectTo={`${window.location.origin}/auth/callback`}
        />
      )}
    </AuthContainer>
  );
};

export default Auth;