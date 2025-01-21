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
    let mounted = true;

    const initializeSession = async () => {
      try {
        console.log("Initializing session in ProtectedRoute");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          throw sessionError;
        }

        // Only update state if component is still mounted
        if (mounted) {
          if (!currentSession) {
            console.log("No active session found");
            setSession(null);
          } else {
            console.log("Active session found:", {
              user: currentSession.user.email,
              expiresAt: currentSession.expires_at
            });
            setSession(currentSession);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) {
          setSession(null);
          setLoading(false);
          toast({
            title: "Sesijos klaida",
            description: "Prašome prisijungti iš naujo",
            variant: "destructive",
          });
        }
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
          setLoading(false);
          toast({
            title: "Prisijungta",
            description: "Sėkmingai prisijungėte prie sistemos",
          });
        } 
        else if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing session");
          setSession(null);
          setLoading(false);
        }
        else if (event === 'TOKEN_REFRESHED') {
          if (!currentSession) {
            console.log("No session after token refresh");
            setSession(null);
            setLoading(false);
            toast({
              title: "Sesija pasibaigė",
              description: "Prašome prisijungti iš naujo",
              variant: "destructive",
            });
          } else {
            console.log("Session refreshed successfully");
            setSession(currentSession);
            setLoading(false);
          }
        }
      });
    };

    // Initialize session and set up listener
    initializeSession();
    const { data: { subscription } } = setupAuthListener();

    // Cleanup function
    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription in ProtectedRoute");
      subscription.unsubscribe();
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1D24]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">GRETVĖJA TASKER</h2>
          <p className="text-gray-400">Kraunama...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};