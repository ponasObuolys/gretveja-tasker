import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AuthLoading } from "@/components/auth/AuthLoading";
import { AuthError } from "@/components/auth/AuthError";
import { useAuthFlow } from "@/hooks/auth/useAuthFlow";
import { authLocalization } from "@/config/auth-localization";
import { authAppearance } from "@/config/auth-appearance";

const Auth = () => {
  const { error, isLoading, isFormReady } = useAuthFlow();
  const redirectUrl = `${window.location.origin}/auth/callback`;
  console.log("Auth redirect URL:", redirectUrl);

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
          showLinks={true}
          redirectTo={redirectUrl}
        />
      )}
    </AuthContainer>
  );
};

export default Auth;