import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useAuthSession } from "./auth/useAuthSession";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuthSession();
  const location = useLocation();

  useEffect(() => {
    // Store the current path for post-auth redirect
    if (!session && !loading) {
      localStorage.setItem("auth_return_url", location.pathname + location.search);
    }
  }, [session, loading, location]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}