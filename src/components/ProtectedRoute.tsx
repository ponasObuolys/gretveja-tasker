import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useAuthSession } from "./auth/useAuthSession";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading, error } = useAuthSession();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message="An error occurred while checking authentication." />;
  }

  if (!session) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}
