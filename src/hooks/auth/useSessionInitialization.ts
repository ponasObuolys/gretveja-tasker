import { useState, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Request batching configuration
const BATCH_WINDOW = 2000; // 2 seconds window for batching
const pendingRequests: Set<() => Promise<void>> = new Set();
let batchTimeout: NodeJS.Timeout | null = null;

const processBatch = async () => {
  if (pendingRequests.size === 0) return;
  
  const requests = Array.from(pendingRequests);
  pendingRequests.clear();
  
  await Promise.all(requests.map(request => request()));
};

interface UseSessionInitializationResult {
  initializeSession: (mounted: boolean) => Promise<void>;
  handleSessionError: (error: Error, mounted: boolean) => void;
}

export const useSessionInitialization = (
  setSession: (session: Session | null) => void,
  setLoading: (loading: boolean) => void
): UseSessionInitializationResult => {
  const { toast } = useToast();
  const initializationAttempts = useRef(0);
  const lastRefreshTimestamp = useRef(0);
  
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

  const refreshSession = async (mounted: boolean): Promise<Session | null> => {
    const now = Date.now();
    if (now - lastRefreshTimestamp.current < 5000) { // Rate limit: 5 seconds
      console.log("Skipping refresh due to rate limiting");
      return null;
    }
    
    lastRefreshTimestamp.current = now;
    
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
        return null;
      }

      console.log("Session refreshed successfully");
      if (mounted) {
        setSession(refreshedSession);
        setLoading(false);
      }
      return refreshedSession;
    } catch (error) {
      handleSessionError(error as Error, mounted);
      return null;
    }
  };

  const initializeSession = async (mounted: boolean) => {
    if (initializationAttempts.current >= 3) {
      console.log("Max initialization attempts reached");
      if (mounted) {
        setSession(null);
        setLoading(false);
      }
      return;
    }

    initializationAttempts.current++;

    return new Promise<void>((resolve) => {
      const request = async () => {
        try {
          console.log("Initializing session");
          const { data: { session: currentSession }, error: sessionError } = 
            await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Error getting session:", sessionError);
            const refreshedSession = await refreshSession(mounted);
            if (!refreshedSession) {
              throw sessionError;
            }
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
          resolve();
        } catch (error) {
          handleSessionError(error as Error, mounted);
          resolve();
        }
      };

      pendingRequests.add(request);
      
      if (!batchTimeout) {
        batchTimeout = setTimeout(() => {
          batchTimeout = null;
          processBatch();
        }, BATCH_WINDOW);
      }
    });
  };

  return { initializeSession, handleSessionError };
};