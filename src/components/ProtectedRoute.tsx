import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log("Initializing session in ProtectedRoute");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          throw sessionError;
        }

        if (!currentSession) {
          console.log("No active session found");
          // Clear any stale tokens
          await supabase.auth.signOut();
          setSession(null);
          return;
        }

        console.log("Active session found:", {
          user: currentSession.user.email,
          expiresAt: currentSession.expires_at
        });
        
        setSession(currentSession);
      } catch (error) {
        console.error("Session initialization error:", error);
        setSession(null);
        toast({
          title: "Sesijos klaida",
          description: "Prašome prisijungti iš naujo",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const setupAuthListener = () => {
      return supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log("Auth state changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email
        });

        if (event === 'SIGNED_IN') {
          setSession(currentSession);
          toast({
            title: "Prisijungta",
            description: "Sėkmingai prisijungėte prie sistemos",
          });
        } 
        else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (!currentSession) {
            console.log("No session after token refresh or sign out");
            setSession(null);
            toast({
              title: "Sesija pasibaigė",
              description: "Prašome prisijungti iš naujo",
              variant: "destructive",
            });
          } else {
            console.log("Session refreshed successfully");
            setSession(currentSession);
          }
        }
      });
    };

    // Initialize session and set up listener
    initializeSession();
    const { data: { subscription } } = setupAuthListener();

    return () => {
      console.log("Cleaning up auth subscription in ProtectedRoute");
      subscription.unsubscribe();
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-600">Kraunama...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};