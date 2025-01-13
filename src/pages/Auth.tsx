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
          setError(getErrorMessage(sessionError));
          return;
        }
        if (session) {
          console.log("Existing session found, redirecting to dashboard");
          navigate("/");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        if (error instanceof AuthError) {
          setError(getErrorMessage(error));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, "Session:", session ? "exists" : "none");
      
      if (event === "SIGNED_IN" && session) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            throw new Error("Nepavyko patikrinti vartotojo profilio");
          }

          console.log("User profile:", profile);
          
          toast({
            title: "Sėkmingai prisijungta",
            description: profile.role === "ADMIN" ? 
              "Sveiki sugrįžę, administratoriau!" : 
              "Sveiki sugrįžę!",
          });

          navigate("/");
        } catch (error) {
          console.error("Login error:", error);
          setError(error instanceof Error ? error.message : "Įvyko nenumatyta klaida");
        }
      } else if (event === "SIGNED_OUT") {
        setError(null);
      } else if (event === "PASSWORD_RECOVERY") {
        toast({
          title: "Slaptažodžio atkūrimas",
          description: "Patikrinkite savo el. paštą dėl slaptažodžio atkūrimo nuorodos",
        });
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <AuthContainer>
      {error && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
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
      />
    </AuthContainer>
  );
};

export default Auth;