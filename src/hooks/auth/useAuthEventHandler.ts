import { debounce } from 'lodash';
import { SESSION_CACHE, clearSessionCache, updateSessionCache } from './useSessionCache';

const EVENT_DEBOUNCE_TIME = 2000;

export const shouldProcessAuthEvent = (event: string, currentSession: any) => {
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

export const createAuthEventHandler = (
  setSession: (session: any) => void,
  supabase: any
) => {
  return debounce(async (event: string, changedSession: any) => {
    console.log('Auth event received:', event, {
      hasSession: !!changedSession,
      user: changedSession?.user?.email
    });

    if (!shouldProcessAuthEvent(event, changedSession)) {
      console.log('Skipping duplicate auth event:', event);
      return;
    }

    if (event === 'SIGNED_OUT') {
      clearSessionCache();
      setSession(null);
    } else if (event === 'TOKEN_REFRESHED' && changedSession) {
      updateSessionCache(changedSession);
      setSession(changedSession);
    } else if (changedSession) {
      updateSessionCache(changedSession);
      setSession(changedSession);
    }
  }, EVENT_DEBOUNCE_TIME);
};