import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { AuthError } from "@/components/auth/AuthError";
import { useAuthFlow } from "@/hooks/auth/useAuthFlow";
import { authLocalization } from "@/config/auth-localization";
import { authAppearance } from "@/config/auth-appearance";
import { useEffect } from "react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const Auth = () => {
  const { error, isLoading, isFormReady } = useAuthFlow();
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  useEffect(() => {
    console.log("Auth component mounted, redirect URL:", redirectUrl);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in Auth component:", event, {
        hasSession: !!session,
        userEmail: session?.user?.email
      });
    });

    return () => {
      console.log("Cleaning up Auth component subscription");
      subscription.unsubscribe();
    };
  }, [redirectUrl]);

  if (isLoading) {
    return <AuthLoading />;
  }

  return (
    <AuthContainer>
      {error && <AuthError message={error} />}

      {isFormReady && (
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={authAppearance}
          localization={{ variables: authLocalization.variables }}
          providers={[]}
          view="sign_in"
          redirectTo={redirectUrl}
          showLinks={true}
          theme="default"
        />
      )}
    </AuthContainer>
  );
};

export default Auth;