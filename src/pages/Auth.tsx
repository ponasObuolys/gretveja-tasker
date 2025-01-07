import { useEffect } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sveiki atvykę į Gretva Tasker
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Prisijunkite prie savo paskyros arba sukurkite naują
          </p>
        </div>
        <SupabaseAuth 
          supabaseClient={supabase} 
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                }
              }
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
              },
              forgotten_password: {
                link_text: "Pamiršote slaptažodį?",
                email_label: "El. paštas",
                password_label: "Slaptažodis",
                email_input_placeholder: "Jūsų el. paštas",
                button_label: "Siųsti atkūrimo nuorodą",
                loading_button_label: "Siunčiama atkūrimo nuoroda...",
                confirmation_text: "Patikrinkite savo el. paštą dėl atkūrimo nuorodos"
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