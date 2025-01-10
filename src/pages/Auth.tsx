import { useEffect, useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: AuthError) => {
    console.log("Auth error details:", error);
    
    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          if (error.message.includes("Invalid login credentials")) {
            return "Neteisingas el. paštas arba slaptažodis";
          }
          if (error.message.includes("Email not confirmed")) {
            return "Prašome patvirtinti el. paštą prieš prisijungiant";
          }
          return "Neteisingi prisijungimo duomenys";
        case 422:
          return "Prašome įvesti teisingą el. paštą ir slaptažodį";
        case 429:
          return "Per daug bandymų prisijungti. Pabandykite vėliau";
        default:
          console.error("Unhandled auth error:", error);
          return "Įvyko klaida bandant prisijungti";
      }
    }
    console.error("Unexpected error type:", error);
    return "Įvyko nenumatyta klaida";
  };

  useEffect(() => {
    const checkExistingSession = async () => {
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
    };
    
    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, "Session:", session ? "exists" : "none");
      
      if (event === "SIGNED_IN" && session) {
        try {
          // Check user profile and role
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
        setError(null); // Clear any existing errors
      } else if (event === "USER_UPDATED") {
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session update error:", sessionError);
          setError(getErrorMessage(sessionError));
        }
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1D24]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#242832] rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            GRETVĖJA TASKER
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Prisijunkite prie savo paskyros
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <SupabaseAuth 
          supabaseClient={supabase} 
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#FF4B6E',
                  brandAccent: '#FF3355',
                  defaultButtonBackground: '#FF4B6E',
                  defaultButtonBackgroundHover: '#FF3355',
                }
              }
            },
            className: {
              container: 'text-white',
              label: 'text-white',
              button: 'bg-[#FF4B6E] hover:bg-[#FF3355] text-white',
              input: 'bg-[#1A1D24] border-gray-700 text-white',
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "El. paštas",
                password_label: "Slaptažodis",
                email_input_placeholder: "Jūsų el. paštas",
                password_input_placeholder: "Jūsų slaptažodis",
                button_label: "Prisijungti",
                loading_button_label: "Jungiamasi...",
                social_provider_text: "Prisijungti su {{provider}}",
                link_text: "Jau turite paskyrą? Prisijunkite"
              },
              sign_up: {
                email_label: "El. paštas",
                password_label: "Slaptažodis",
                email_input_placeholder: "Jūsų el. paštas",
                password_input_placeholder: "Jūsų slaptažodis",
                button_label: "Registruotis",
                loading_button_label: "Registruojama...",
                social_provider_text: "Registruotis su {{provider}}",
                link_text: "Neturite paskyros? Registruokitės",
                confirmation_text: "Patikrinkite savo el. paštą dėl patvirtinimo nuorodos"
              }
            }
          }}
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Auth;