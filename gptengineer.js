import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Global session cache with expiry
const SESSION_CACHE = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, changedSession) => {
      if (!mountedRef.current) return;
      
      console.log("[Auth] State changed:", event);
      if (event === 'SIGNED_OUT') {
        SESSION_CACHE.data = null;
        SESSION_CACHE.timestamp = 0;
      }
      initialize();
    });

    cleanupRef.current = () => {
      console.log("[Auth] Cleaning up subscription");
      subscription?.unsubscribe();
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