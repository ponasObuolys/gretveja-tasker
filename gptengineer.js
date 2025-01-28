import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { debounce } from 'lodash';

// Global session cache with expiry
const SESSION_CACHE = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  refreshPromise: null
};

const useAuthSession = () => {
  const [session, setSession] = useState(null);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const cleanupRef = useRef(() => {});

  const isSessionValid = () => {
    return (
      SESSION_CACHE.data &&
      Date.now() - SESSION_CACHE.timestamp < SESSION_CACHE.CACHE_DURATION
    );
  };

  // Debounced token refresh function
  const debouncedRefreshToken = debounce(async () => {
    if (SESSION_CACHE.refreshPromise) {
      return SESSION_CACHE.refreshPromise;
    }

    try {
      SESSION_CACHE.refreshPromise = supabase.auth.refreshSession();
      const { data: { session: refreshedSession }, error } = await SESSION_CACHE.refreshPromise;

      if (error) {
        console.error('[Auth] Session refresh error:', error);
        return null;
      }

      if (refreshedSession) {
        SESSION_CACHE.data = refreshedSession;
        SESSION_CACHE.timestamp = Date.now();
        return refreshedSession;
      }
    } catch (error) {
      console.error('[Auth] Token refresh error:', error);
      return null;
    } finally {
      SESSION_CACHE.refreshPromise = null;
    }
  }, 1000, { leading: true, trailing: false }); // Only execute first call within 1 second

  const initialize = async () => {
    if (!mountedRef.current || initializingRef.current) return;
    
    try {
      initializingRef.current = true;

      if (isSessionValid()) {
        console.log("[Auth] Using cached session");
        if (mountedRef.current) {
          setSession(SESSION_CACHE.data);
        }
        return;
      }

      console.log("[Auth] Fetching new session");
      const { data: { session: newSession } } = await supabase.auth.getSession();

      if (!mountedRef.current) return;

      if (newSession) {
        console.log("[Auth] New session cached");
        SESSION_CACHE.data = newSession;
        SESSION_CACHE.timestamp = Date.now();
        setSession(newSession);
      } else {
        console.log("[Auth] No active session");
        SESSION_CACHE.data = null;
        SESSION_CACHE.timestamp = 0;
        setSession(null);
      }
    } catch (error) {
      console.error('[Auth] Session initialization error:', error);
      if (mountedRef.current) {
        SESSION_CACHE.data = null;
        SESSION_CACHE.timestamp = 0;
        setSession(null);
      }
    } finally {
      initializingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, changedSession) => {
      if (!mountedRef.current) return;
      
      console.log("[Auth] State changed:", event);
      if (event === 'SIGNED_OUT') {
        SESSION_CACHE.data = null;
        SESSION_CACHE.timestamp = 0;
        SESSION_CACHE.refreshPromise = null;
      } else if (event === 'TOKEN_REFRESHED' && changedSession) {
        // Update cache with the refreshed session
        SESSION_CACHE.data = changedSession;
        SESSION_CACHE.timestamp = Date.now();
      }
      
      if (mountedRef.current) {
        setSession(changedSession);
      }
    });

    cleanupRef.current = () => {
      console.log("[Auth] Cleaning up subscription");
      subscription?.unsubscribe();
      debouncedRefreshToken.cancel();
    };

    initialize();

    return () => {
      mountedRef.current = false;
      cleanupRef.current();
    };
  }, []);

  return session;
};

export default useAuthSession;