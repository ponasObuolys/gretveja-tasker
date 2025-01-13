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
  const [isLoading, setIsLoading] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFormReady(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      console.log("Auth component unmounting - resetting state");
      setError(null);
      setIsLoading(false);
    };
  }, []);

  useEffect(() => {
    const clearStaleSession = async () => {
      console.log("Checking for and clearing stale session");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session state:", {
          exists: !!session,
          user: session?.user?.email,
          expiresAt: session?.expires_at
        });
        
        if (!session) {
          console.log("No active session found, clearing any stale auth state");
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (error) {
        console.error("Error clearing stale session:", error);
      }
    };

    const checkExistingSession = async () => {
      setIsLoading(true);
      try {
        await clearStaleSession();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session check error:", sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log("Active session found:", {
            email: session.user.email,
            id: session.user.id,
            role: session.user.role,
            lastSignInAt: session.user.last_sign_in_at
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        setError(error instanceof AuthError ? getErrorMessage(error) : "Sesijos patikrinimo klaida");
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, {
        hasSession: !!session,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        lastSignIn: session?.user?.last_sign_in_at
      });
      
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile fetch error:", profileError);
            throw new Error(profileError.message);
          }

          if (!profile) {
            console.error("No profile found for user:", session.user.id);
            throw new Error("Profilis nerastas");
          }

          toast({
            title: "Sėkmingai prisijungta",
            description: profile.role === "ADMIN" ? 
              "Sveiki sugrįžę, administratoriau!" : 
              "Sveiki sugrįžę!"
          });

          navigate("/");
        } catch (error) {
          console.error("Profile fetch error:", error);
          setError(error instanceof Error ? error.message : "Profilio gavimo klaida");
        }
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out, clearing error state");
        setError(null);
      } else if (event === "USER_UPDATED") {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session error after user update:", sessionError);
          setError(getErrorMessage(sessionError));
        }
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (!isFormReady || isLoading) {
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

      <SupabaseAuth 
        supabaseClient={supabase}
        appearance={authAppearance}
        localization={{ variables: authLocalization.variables }}
        providers={[]}
        redirectTo={`${window.location.origin}/auth/callback`}
      />
    </AuthContainer>
  );
};

export default Auth;