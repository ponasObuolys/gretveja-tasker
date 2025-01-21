import { Navigate, useLocation } from "react-router-dom";
import { LoadingScreen } from "./auth/LoadingScreen";
import { useAuthSession } from "./auth/useAuthSession";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { session, loading } = useAuthSession();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};