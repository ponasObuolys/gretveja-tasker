import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const useAuthSession = () => {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;
      
      if (cachedSession) {
        setSession(cachedSession);
        return;
      }

      try {
        const newSession = await supabase.auth.getSession();
        if (!isMounted) return;
        
        cachedSession = newSession;
        setSession(newSession);
        
        clearTimeout(sessionTimeout);
        sessionTimeout = setTimeout(() => {
          if (cachedSession === newSession) {
            cachedSession = null;
          }
        }, 300000);
      } catch (error) {
        console.error('Failed to get auth session:', error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      cachedSession = null;
      initialize();
    });

    initialize();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      clearTimeout(sessionTimeout);
    };
  }, []);

  return session;
};

export default useAuthSession; 