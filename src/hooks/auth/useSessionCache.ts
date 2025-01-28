interface SessionCache {
  data: any;
  timestamp: number;
  CACHE_DURATION: number;
  refreshPromise: Promise<any> | null;
  lastAuthEvent: string | null;
  lastEventTimestamp: number;
  isInitialized: boolean;
  initializationPromise: Promise<void> | null;
  globalInitComplete: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const SESSION_CACHE: SessionCache = {
  data: null,
  timestamp: 0,
  CACHE_DURATION,
  refreshPromise: null,
  lastAuthEvent: null,
  lastEventTimestamp: 0,
  isInitialized: false,
  initializationPromise: null,
  globalInitComplete: false
};

export const isSessionValid = () => {
  return (
    SESSION_CACHE.data &&
    Date.now() - SESSION_CACHE.timestamp < SESSION_CACHE.CACHE_DURATION
  );
};

export const clearSessionCache = () => {
  SESSION_CACHE.data = null;
  SESSION_CACHE.timestamp = 0;
  SESSION_CACHE.refreshPromise = null;
  SESSION_CACHE.globalInitComplete = false;
  SESSION_CACHE.initializationPromise = null;
};

export const updateSessionCache = (session: any) => {
  SESSION_CACHE.data = session;
  SESSION_CACHE.timestamp = Date.now();
};