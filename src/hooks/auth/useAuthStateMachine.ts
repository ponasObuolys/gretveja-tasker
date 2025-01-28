import { create } from 'zustand';
import { monitorResourceLoad } from '@/utils/resourceMonitor';
import * as Sentry from '@sentry/react';

type AuthState = 
  | 'IDLE' 
  | 'INITIALIZING' 
  | 'AUTHENTICATED' 
  | 'UNAUTHENTICATED' 
  | 'ERROR' 
  | 'TOKEN_REFRESH';

interface AuthStateMachine {
  state: AuthState;
  error: Error | null;
  initializationLock: boolean;
  lastInitAttempt: number | null;
  setState: (state: AuthState) => void;
  setError: (error: Error | null) => void;
  acquireInitLock: () => boolean;
  releaseInitLock: () => void;
  resetState: () => void;
}

const INIT_COOLDOWN = 2000; // 2 seconds

export const useAuthStateMachine = create<AuthStateMachine>((set, get) => ({
  state: 'IDLE',
  error: null,
  initializationLock: false,
  lastInitAttempt: null,

  setState: (state) => set({ state }),
  
  setError: (error) => {
    set({ error });
    if (error && import.meta.env.PROD) {
      Sentry.captureException(error, {
        tags: { state: get().state },
      });
    }
  },

  acquireInitLock: () => {
    const { initializationLock, lastInitAttempt } = get();
    const now = Date.now();

    // Prevent rapid re-initialization attempts
    if (lastInitAttempt && (now - lastInitAttempt) < INIT_COOLDOWN) {
      return false;
    }

    if (initializationLock) {
      return false;
    }

    set({ 
      initializationLock: true,
      lastInitAttempt: now,
    });
    return true;
  },

  releaseInitLock: () => {
    set({ initializationLock: false });
  },

  resetState: () => {
    set({
      state: 'IDLE',
      error: null,
      initializationLock: false,
      lastInitAttempt: null,
    });
  },
}));

export const withAuthStateTracking = async <T>(
  operation: () => Promise<T>,
  initialState: AuthState,
  finalState: AuthState
): Promise<T> => {
  const authState = useAuthStateMachine.getState();
  
  try {
    authState.setState(initialState);
    const result = await monitorResourceLoad('auth', operation);
    authState.setState(finalState);
    return result;
  } catch (error) {
    authState.setState('ERROR');
    authState.setError(error as Error);
    throw error;
  }
}; 