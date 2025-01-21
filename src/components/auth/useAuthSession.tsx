import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        console.log("Initializing session in useAuthSession");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          throw sessionError;
        }

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

        if (mounted) {
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
        }
      });
    };

    initializeSession();
    const { data: { subscription } } = setupAuthListener();

    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription in useAuthSession");
      subscription.unsubscribe();
    };
  }, [toast]);

  return { session, loading };
};