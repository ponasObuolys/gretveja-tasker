import { SESSION_CACHE, isSessionValid, updateSessionCache } from './useSessionCache';
import { supabase } from '@/integrations/supabase/client';

export const initializeSession = async (
  mounted: boolean,
  setSession: (session: any) => void,
) => {
  if (!mounted || SESSION_CACHE.globalInitComplete) {
    console.log('Skipping initialization - already complete or unmounted');
    return;
  }

  if (SESSION_CACHE.initializationPromise) {
    console.log('Initialization already in progress');
    return SESSION_CACHE.initializationPromise;
  }

  try {
    SESSION_CACHE.initializationPromise = (async () => {
      if (isSessionValid()) {
        console.log('Using cached session');
        if (mounted) {
          setSession(SESSION_CACHE.data);
          SESSION_CACHE.globalInitComplete = true;
        }
        return;
      }

      console.log('Fetching new session');
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        console.log('New session obtained');
        updateSessionCache(session);
        SESSION_CACHE.globalInitComplete = true;
        setSession(session);
      } else {
        console.log('No session found');
        SESSION_CACHE.globalInitComplete = true;
        setSession(null);
      }
    })();

    await SESSION_CACHE.initializationPromise;
  } catch (error) {
    console.error('Session initialization error:', error);
  } finally {
    SESSION_CACHE.initializationPromise = null;
  }
};