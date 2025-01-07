import { useEffect, useState, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000; // 2 seconds
const MAX_DELAY = 30000; // 30 seconds

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  // Debounced session refresh with exponential backoff
  const refreshSession = useCallback(async () => {
    if (isRefreshing || retryCount >= MAX_RETRIES) {
      return;
    }

    try {
      setIsRefreshing(true);
      console.log(`Attempt ${retryCount + 1} of ${MAX_RETRIES} to refresh session`);

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
          if (retryCount < MAX_RETRIES) {
            const backoffTime = Math.min(
              INITIAL_DELAY * Math.pow(2, retryCount),
              MAX_DELAY
            );
            console.log(`Rate limited, backing off for ${backoffTime}ms`);
            
            toast({
              title: "Bandoma prisijungti iš naujo",
              description: `Bandymas ${retryCount + 1} iš ${MAX_RETRIES}. Palaukite kelias sekundes...`,
            });
            
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setIsRefreshing(false);
              refreshSession();
            }, backoffTime);
            return;
          } else {
            console.log("Max retries reached, redirecting to auth");
            toast({
              title: "Nepavyko prisijungti",
              description: "Per daug bandymų. Prašome pabandyti vėliau.",
              variant: "destructive",
            });
          }
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
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [toast, retryCount, isRefreshing]);

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