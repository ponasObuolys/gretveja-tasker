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
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast({
            title: "Klaida",
            description: "Nepavyko gauti sesijos. Bandykite dar kartą.",
            variant: "destructive",
          });
          return;
        }

        if (mounted) {
          console.log("Setting initial session:", {
            hasSession: !!currentSession,
            user: currentSession?.user?.email
          });
          setSession(currentSession);
          setLoading(false);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        if (mounted) {
          setLoading(false);
          toast({
            title: "Klaida",
            description: "Įvyko klaida. Bandykite dar kartą vėliau.",
            variant: "destructive",
          });
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email
        });

        if (!mounted) return;

        if (event === 'SIGNED_IN') {
          setSession(currentSession);
          setLoading(false);
          toast({
            title: "Prisijungta",
            description: "Sėkmingai prisijungėte prie sistemos",
          });
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setLoading(false);
          console.log("User signed out");
        } else if (event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setLoading(false);
          console.log("Token refreshed");
        }
      }
    );

    // Initialize session
    initializeSession();

    // Cleanup
    return () => {
      mounted = false;
      console.log("Cleaning up auth subscription in useAuthSession");
      subscription.unsubscribe();
    };
  }, [toast]);

  return { session, loading };
};