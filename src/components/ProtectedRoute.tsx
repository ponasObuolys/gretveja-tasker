import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAndRefreshSession = async () => {
      try {
        console.log("Checking session...");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Current session:", currentSession ? "exists" : "none");
        
        if (!currentSession) {
          console.log("No current session found, redirecting to auth");
          setSession(null);
          setLoading(false);
          return;
        }

        console.log("Attempting to refresh session...");
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Session refresh error:", refreshError);
          await supabase.auth.signOut();
          setSession(null);
          toast({
            title: "Sesija pasibaigė",
            description: "Prašome prisijungti iš naujo",
            variant: "destructive",
          });
        } else {
          console.log("Session refreshed successfully");
          setSession(refreshedSession);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial session check
    checkAndRefreshSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, currentSession) => {
      console.log("Auth state changed:", event, "Session:", currentSession ? "exists" : "none");
      
      switch (event) {
        case 'SIGNED_OUT':
          console.log("User signed out");
          setSession(null);
          toast({
            title: "Atsijungta",
            description: "Sėkmingai atsijungėte iš sistemos",
          });
          break;
        case 'SIGNED_IN':
          console.log("User signed in");
          setSession(currentSession);
          break;
        case 'TOKEN_REFRESHED':
          console.log("Token refreshed");
          setSession(currentSession);
          break;
        default:
          console.log("Unhandled auth event:", event);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [toast]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Kraunama...</div>;
  }

  if (!session) {
    console.log("No session, redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log("Session valid, rendering protected content");
  return <>{children}</>;
};