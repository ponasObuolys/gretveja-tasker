import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { debounce } from 'lodash';

// Global session cache with expiry
const SESSION_CACHE = {
  data: null,
  timestamp: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  refreshPromise: null,
  lastAuthEvent: null,
  lastEventTimestamp: 0,
  isInitialized: false,
  initializationPromise: null,
  globalInitComplete: false // New flag to track global initialization completion
};

const EVENT_DEBOUNCE_TIME = 2000;

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

  const shouldProcessAuthEvent = (event, currentSession) => {
    const now = Date.now();
    const eventKey = `${event}-${currentSession?.user?.id || 'no-user'}`;
    
    if (
      SESSION_CACHE.lastAuthEvent === eventKey &&
      now - SESSION_CACHE.lastEventTimestamp < EVENT_DEBOUNCE_TIME
    ) {
      return false;
    }

    SESSION_CACHE.lastAuthEvent = eventKey;
    SESSION_CACHE.lastEventTimestamp = now;
    return true;
  };

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
  }, 2000, { leading: true, trailing: false });

  const initialize = async () => {
    // Skip if global initialization is complete or component is unmounted
    if (!mountedRef.current || SESSION_CACHE.globalInitComplete) {
      return;
    }

    // Return existing initialization promise if one exists
    if (SESSION_CACHE.initializationPromise) {
      return SESSION_CACHE.initializationPromise;
    }

    try {
      initializingRef.current = true;
      
      SESSION_CACHE.initializationPromise = (async () => {
        if (isSessionValid()) {
          if (mountedRef.current) {
            setSession(SESSION_CACHE.data);
            SESSION_CACHE.globalInitComplete = true;
          }
          return;
        }

        const { data: { session: newSession } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (newSession) {
          SESSION_CACHE.data = newSession;
          SESSION_CACHE.timestamp = Date.now();
          SESSION_CACHE.globalInitComplete = true;
          setSession(newSession);
        } else {
          SESSION_CACHE.data = null;
          SESSION_CACHE.timestamp = 0;
          SESSION_CACHE.globalInitComplete = true;
          setSession(null);
        }
      })();

      await SESSION_CACHE.initializationPromise;
    } catch (error) {
      console.error('[Auth] Session initialization error:', error);
      if (mountedRef.current) {
        SESSION_CACHE.data = null;
        SESSION_CACHE.timestamp = 0;
        SESSION_CACHE.globalInitComplete = false;
        setSession(null);
      }
    } finally {
      initializingRef.current = false;
      SESSION_CACHE.initializationPromise = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, changedSession) => {
      if (!mountedRef.current || !shouldProcessAuthEvent(event, changedSession)) return;
      
      if (event === 'SIGNED_OUT') {
        SESSION_CACHE.data = null;
        SESSION_CACHE.timestamp = 0;
        SESSION_CACHE.refreshPromise = null;
        SESSION_CACHE.globalInitComplete = false;
        SESSION_CACHE.initializationPromise = null;
        if (mountedRef.current) {
          setSession(null);
        }
      } else if (event === 'TOKEN_REFRESHED' && changedSession) {
        SESSION_CACHE.data = changedSession;
        SESSION_CACHE.timestamp = Date.now();
        if (mountedRef.current) {
          setSession(changedSession);
        }
      } else if (changedSession) {
        SESSION_CACHE.data = changedSession;
        SESSION_CACHE.timestamp = Date.now();
        if (mountedRef.current) {
          setSession(changedSession);
        }
      }
    });

    cleanupRef.current = () => {
      subscription?.unsubscribe();
      debouncedRefreshToken.cancel();
    };

    // Only initialize if not already completed globally
    if (!SESSION_CACHE.globalInitComplete) {
      initialize();
    } else if (SESSION_CACHE.data && mountedRef.current) {
      // If already initialized, just set the session from cache
      setSession(SESSION_CACHE.data);
    }

    return () => {
      mountedRef.current = false;
      cleanupRef.current();
    };
  }, []);

  return session;
};

export default useAuthSession;