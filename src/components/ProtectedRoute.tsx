import { useEffect, useState, useCallback } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
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

  useEffect(() => {
    // Initialize session
    const initializeSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
      } catch (error) {
        console.error("Error initializing session:", error);
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

    // Handle session refresh
    const setupAuthListener = () => {
      return supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'SIGNED_IN') {
          setSession(currentSession);
          toast({
            title: "Prisijungta",
            description: "Sėkmingai prisijungėte prie sistemos",
          });
        } 
        else if (event === 'SIGNED_OUT') {
          setSession(null);
          toast({
            title: "Atsijungta",
            description: "Sėkmingai atsijungėte iš sistemos",
          });
        } 
        else if (event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
        }
        
        setLoading(false);
      });
    };

    // Set up periodic session check
    const sessionCheckInterval = setInterval(async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) {
        setSession(null);
        toast({
          title: "Sesija pasibaigė",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Initialize everything
    initializeSession();
    const { data: { subscription } } = setupAuthListener();

    // Cleanup
    return () => {
      clearInterval(sessionCheckInterval);
      subscription.unsubscribe();
    };
  }, [refreshSession, toast]);

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Kraunama...
      </div>
    );
  }

  // Redirect to auth if no session
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
};