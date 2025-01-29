import { useState, useEffect, useCallback, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionInitialization } from "@/hooks/auth/useSessionInitialization";
import { useAuthStateHandlers } from "@/hooks/auth/useAuthStateHandlers";
import { debounce } from "lodash";
import { useConnectionState } from "@/utils/connectionState";

interface UseAuthSessionResult {
  session: Session | null;
  loading: boolean;
}

const MAX_REFRESH_RETRIES = 3;
const REFRESH_RETRY_DELAY = 1000;
const AUTH_STATE_DEBOUNCE = 300;

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshRetries, setRefreshRetries] = useState(0);
  const initializationAttempted = useRef(false);
  const { toast } = useToast();
  const { isOnline } = useConnectionState();
  const mountedRef = useRef(true);

  const initSession = useSessionInitialization(setSession, setLoading);
  const { onSignIn, onSignOut, onTokenRefresh } = useAuthStateHandlers(setSession, setLoading);

  const setupRefreshTimer = useCallback(async (currentSession: Session) => {
    if (!currentSession?.expires_at || !mountedRef.current) return;

    const expiresAt = new Date(currentSession.expires_at * 1000);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

    if (timeUntilExpiry > refreshBuffer) {
      const refreshTime = timeUntilExpiry - refreshBuffer;
      console.log(`Scheduling token refresh in ${refreshTime / 1000} seconds`);
      
      setTimeout(async () => {
        if (!mountedRef.current) return;
        if (!isOnline) {
          console.log("Offline - caching refresh request");
          return;
        }

        console.log("Executing scheduled token refresh");
        try {
          const { data: { session: refreshedSession }, error } = 
            await supabase.auth.refreshSession();

          if (error) throw error;

          if (refreshedSession && mountedRef.current) {
            console.log("Token refresh successful");
            setRefreshRetries(0);
            onTokenRefresh(refreshedSession);
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          
          if (refreshRetries < MAX_REFRESH_RETRIES && mountedRef.current) {
            console.log(`Retrying refresh (attempt ${refreshRetries + 1}/${MAX_REFRESH_RETRIES})`);
            setTimeout(() => {
              if (mountedRef.current) {
                setRefreshRetries(prev => prev + 1);
                setupRefreshTimer(currentSession);
              }
            }, REFRESH_RETRY_DELAY * (refreshRetries + 1));
          } else {
            console.log("Max refresh retries reached, logging out");
            if (mountedRef.current) {
              onSignOut();
              toast({
                title: "Sesija pasibaigė",
                description: "Prašome prisijungti iš naujo",
                variant: "destructive",
              });
            }
          }
        }
      }, refreshTime);
    }
  }, [isOnline, onTokenRefresh, onSignOut, refreshRetries, toast]);

  const debouncedAuthStateChange = useCallback(
    debounce(async (event: string, currentSession: Session | null) => {
      if (!mountedRef.current) return;

      console.log("Debounced auth state change:", event, {
        hasSession: !!currentSession,
        user: currentSession?.user?.email,
        isOnline
      });

      if (!isOnline) {
        console.log("Offline - caching auth state change");
        return;
      }

      if (event === 'SIGNED_IN' && currentSession) {
        onSignIn(currentSession);
        await setupRefreshTimer(currentSession);
      } else if (event === 'SIGNED_OUT') {
        onSignOut();
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        onTokenRefresh(currentSession);
        await setupRefreshTimer(currentSession);
      }
    }, AUTH_STATE_DEBOUNCE),
    [onSignIn, onSignOut, onTokenRefresh, setupRefreshTimer, isOnline]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (initializationAttempted.current) {
      console.log("Skipping duplicate initialization");
      return;
    }

    console.log("Starting auth session initialization");
    initializationAttempted.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mountedRef.current) return;

        console.log("Auth state changed:", event, {
          hasSession: !!currentSession,
          user: currentSession?.user?.email,
          currentPath: window.location.pathname,
          isOnline
        });

        debouncedAuthStateChange(event, currentSession);
      }
    );

    initSession(mountedRef.current);

    return () => {
      console.log("Cleaning up auth session");
      mountedRef.current = false;
      debouncedAuthStateChange.cancel();
      subscription.unsubscribe();
    };
  }, [debouncedAuthStateChange, initSession, isOnline]);

  return { session, loading };
};