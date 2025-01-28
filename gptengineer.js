import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Cache variables declared outside component to persist between renders
let cachedSession = null;
let sessionTimeout = null;

const useAuthSession = () => {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;
      
      // Use cached session if available
      if (cachedSession) {
        console.log("Using cached session");
        setSession(cachedSession);
        return;
      }

      try {
        console.log("Fetching new auth session");
        const { data: { session: newSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (newSession) {
          console.log("New session fetched and cached");
          cachedSession = newSession;
          setSession(newSession);
          
          // Clear existing timeout if any
          if (sessionTimeout) {
            clearTimeout(sessionTimeout);
          }
          
          // Set new timeout to clear cache after 5 minutes
          sessionTimeout = setTimeout(() => {
            console.log("Clearing cached session");
            if (cachedSession === newSession) {
              cachedSession = null;
            }
          }, 300000); // 5 minutes
        } else {
          console.log("No active session found");
          cachedSession = null;
          setSession(null);
        }
      } catch (error) {
        console.error('Failed to get auth session:', error);
        cachedSession = null;
        if (isMounted) {
          setSession(null);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, changedSession) => {
      console.log("Auth state changed:", event);
      cachedSession = null; // Clear cache on auth state change
      initialize();
    });

    initialize();

    return () => {
      console.log("Cleaning up auth session hook");
      isMounted = false;
      subscription?.unsubscribe();
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, []);

  return session;
};

export default useAuthSession;