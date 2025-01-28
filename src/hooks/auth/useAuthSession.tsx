import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SESSION_CACHE } from './useSessionCache';
import { createAuthEventHandler } from './useAuthEventHandler';
import { initializeSession } from './useSessionInitialization';

export const useAuthSession = () => {
  const [session, setSession] = useState(SESSION_CACHE.data);
  const mountedRef = useRef(true);
  const authEventHandler = createAuthEventHandler(setSession, supabase);

  useEffect(() => {
    if (SESSION_CACHE.globalInitComplete && SESSION_CACHE.data) {
      setSession(SESSION_CACHE.data);
      return;
    }

    mountedRef.current = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, changedSession) => {
        if (!mountedRef.current) return;
        authEventHandler(event, changedSession);
      }
    );

    if (!SESSION_CACHE.globalInitComplete) {
      initializeSession(mountedRef.current, setSession);
    }

    return () => {
      mountedRef.current = false;
      authEventHandler.cancel();
      subscription.unsubscribe();
      console.log('Cleaning up auth subscription');
    };
  }, [authEventHandler]);

  return session;
};

export default useAuthSession;