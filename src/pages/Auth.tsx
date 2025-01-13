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

  useEffect(() => {
    const checkExistingSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session check error:", sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log("Active session found:", {
            email: session.user.email,
            id: session.user.id,
            role: session.user.role
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
      console.log("Auth event:", event);
      
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            throw new Error(profileError.message);
          }

          if (!profile) {
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
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <AuthContainer>
      {error && (
        <Alert variant="destructive" className="mb-4 border-red-500/50 bg-red-500/10">
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center">
          <span className="text-gray-400">Kraunama...</span>
        </div>
      ) : (
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={authAppearance}
          localization={{ variables: authLocalization.variables }}
          providers={[]}
          redirectTo={`${window.location.origin}/auth/callback`}
          onError={(error) => {
            console.error("Auth error:", error);
            setError(getErrorMessage(error));
          }}
        />
      )}
    </AuthContainer>
  );
};

export default Auth;