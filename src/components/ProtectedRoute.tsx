import { useEffect, useState, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const location = useLocation();
  const { toast } = useToast();

  // Debounced session refresh with exponential backoff
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log("No current session found");
        setSession(null);
        return;
      }

      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("Session refresh error:", refreshError);
        
        // Handle rate limiting specifically
        if (refreshError.message.includes('429') || refreshError.message.includes('rate_limit')) {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
          console.log(`Rate limited, backing off for ${backoffTime}ms`);
          
          toast({
            title: "Bandoma prisijungti iš naujo",
            description: "Palaukite kelias sekundes...",
          });
          
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            refreshSession();
          }, backoffTime);
          return;
        }

        // Handle other errors
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
        setRetryCount(0); // Reset retry count on success
      }
    } catch (error) {
      console.error("Session check error:", error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [toast, retryCount]);

  useEffect(() => {
    // Initial session check
    refreshSession();

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
          setRetryCount(0); // Reset retry count on sign in
          break;
        case 'TOKEN_REFRESHED':
          console.log("Token refreshed");
          setSession(currentSession);
          setRetryCount(0); // Reset retry count on token refresh
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
  }, [refreshSession, toast]);

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