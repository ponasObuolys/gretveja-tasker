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
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (error: AuthError) => {
    console.log("Auth error details:", error);
    
    // Try to parse the error body if it's a string
    let errorBody;
    if (error instanceof AuthApiError && typeof error.message === 'string') {
      try {
        errorBody = JSON.parse(error.message);
      } catch (e) {
        errorBody = { code: error.message };
      }
    }
    
    // Get the error code either from parsed body or directly from error
    const errorCode = errorBody?.code || error.message;
    console.log("Error code:", errorCode);

    switch (errorCode) {
      case "invalid_credentials":
        return "Neteisingas el. paštas arba slaptažodis";
      case "email_not_confirmed":
        return "Patvirtinkite el. paštą";
      case "user_not_found":
        return "Vartotojas nerastas";
      case "too_many_requests":
        return "Per daug bandymų. Bandykite vėliau";
      case "invalid_grant":
        return "Neteisingi prisijungimo duomenys";
      case "invalid_email":
        return "Neteisingas el. pašto formatas";
      default:
        console.error("Unhandled auth error:", error);
        return "Įvyko klaida. Bandykite dar kartą vėliau.";
    }
  };

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
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
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
                  inputBackground: '#1A1D24',
                  inputBorder: '#374151',
                  inputBorderHover: '#4B5563',
                  inputBorderFocus: '#FF4B6E',
                }
              }
            },
            className: {
              container: 'text-white',
              label: 'text-white',
              button: 'bg-[#FF4B6E] hover:bg-[#FF3355] text-white transition-colors duration-200',
              input: 'bg-[#1A1D24] border-gray-700 text-white',
              loader: 'border-t-[#FF4B6E]',
              message: 'text-red-400'
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "El. paštas",
                password_label: "Slaptažodis",
                email_input_placeholder: "Jūsų el. paštas",
                password_input_placeholder: "Jūsų slaptažodis",
                button_label: isLoading ? "Jungiamasi..." : "Prisijungti",
                loading_button_label: "Jungiamasi...",
                social_provider_text: "Prisijungti su {{provider}}",
                link_text: "Jau turite paskyrą? Prisijunkite",
              },
              sign_up: {
                email_label: "El. paštas",
                password_label: "Slaptažodis",
                email_input_placeholder: "Jūsų el. paštas",
                password_input_placeholder: "Jūsų slaptažodis",
                button_label: isLoading ? "Registruojama..." : "Registruotis",
                loading_button_label: "Registruojama...",
                social_provider_text: "Registruotis su {{provider}}",
                link_text: "Neturite paskyros? Registruokitės",
                confirmation_text: "Patikrinkite savo el. paštą dėl patvirtinimo nuorodos"
              },
              forgotten_password: {
                email_label: "El. paštas",
                password_label: "Slaptažodis",
                email_input_placeholder: "Jūsų el. paštas",
                button_label: isLoading ? "Siunčiama..." : "Siųsti atkūrimo nuorodą",
                loading_button_label: "Siunčiama...",
                link_text: "Pamiršote slaptažodį?",
                confirmation_text: "Patikrinkite savo el. paštą dėl slaptažodžio atkūrimo nuorodos"
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