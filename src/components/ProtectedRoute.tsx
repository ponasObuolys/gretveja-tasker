import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useAuthSession } from "./auth/useAuthSession";
import { Navigate } from "react-router-dom";
import { useAuthInitialization } from "@/hooks/auth/useAuthInitialization";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuthSession();
  const { isLocked, isTimedOut, forceRefresh } = useAuthInitialization();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isLocked || isTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Autentifikacijos klaida</AlertTitle>
          <AlertDescription>
            {isLocked
              ? "Autentifikacija užblokuota dėl per didelio bandymų skaičiaus."
              : "Autentifikacijos laikas baigėsi."}
          </AlertDescription>
        </Alert>
        <Button
          onClick={forceRefresh}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Bandyti dar kartą
        </Button>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}