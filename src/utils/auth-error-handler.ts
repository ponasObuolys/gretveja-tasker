import { AuthError, AuthApiError } from "@supabase/supabase-js";

export const getErrorMessage = (error: AuthError) => {
  console.log("Auth error details:", error);
  
  let errorBody;
  if (error instanceof AuthApiError && error.message) {
    try {
      errorBody = JSON.parse(error.message);
    } catch (e) {
      errorBody = { code: error.message };
    }
  }
  
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
    case "http_client_error":
      return "Prisijungimo klaida. Patikrinkite prisijungimo duomenis";
    default:
      console.error("Unhandled auth error:", error);
      return "Įvyko klaida. Bandykite dar kartą vėliau.";
  }
};