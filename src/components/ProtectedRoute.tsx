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
        // First try to get the current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          // If no session exists, redirect to auth
          setSession(null);
          setLoading(false);
          return;
        }

        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Session refresh error:", refreshError);
          // If refresh fails, sign out and redirect
          await supabase.auth.signOut();
          setSession(null);
          toast({
            title: "Sesija pasibaigė",
            description: "Prašome prisijungti iš naujo",
            variant: "destructive",
          });
        } else {
          setSession(refreshedSession);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkAndRefreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_OUT') {
        setSession(null);
        toast({
          title: "Atsijungta",
          description: "Sėkmingai atsijungėte iš sistemos",
        });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Kraunama...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};