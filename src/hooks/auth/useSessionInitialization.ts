import { useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseSessionInitializationResult {
  initializeSession: (mounted: boolean) => Promise<void>;
  handleSessionError: (error: Error, mounted: boolean) => void;
}

export const useSessionInitialization = (
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void
): UseSessionInitializationResult => {
  const { toast } = useToast();

  const handleSessionError = (error: Error, mounted: boolean) => {
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
  };

  const refreshSession = async (mounted: boolean) => {
    try {
      console.log("Attempting to refresh session");
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("Session refresh error:", refreshError);
        throw refreshError;
      }

      if (!refreshedSession) {
        console.log("No session after refresh attempt");
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      console.log("Session refreshed successfully");
      if (mounted) {
        setSession(refreshedSession);
        setLoading(false);
      }
    } catch (error) {
      handleSessionError(error as Error, mounted);
    }
  };

  const initializeSession = async (mounted: boolean) => {
    try {
      console.log("Initializing session in useAuthSession");
      const { data: { session: currentSession }, error: sessionError } = 
        await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        await refreshSession(mounted);
        return;
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
      handleSessionError(error as Error, mounted);
    }
  };

  return { initializeSession, handleSessionError };
};