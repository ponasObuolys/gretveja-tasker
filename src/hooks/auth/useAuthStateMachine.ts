import { create } from 'zustand';
import { monitorResourceLoad } from '@/utils/resourceMonitor';
import * as Sentry from '@sentry/react';

type AuthState = 
  | 'IDLE' 
  | 'INITIALIZING' 
  | 'AUTHENTICATED' 
  | 'UNAUTHENTICATED' 
  | 'TOKEN_REFRESH_NEEDED'
  | 'TOKEN_REFRESHING'
  | 'TOKEN_REFRESH_FAILED'
  | 'ERROR';

type StateTransition = {
  from: AuthState;
  to: AuthState;
  timestamp: number;
};

interface AuthStateMachine {
  state: AuthState;
  error: Error | null;
  initializationLock: boolean;
  lastInitAttempt: number | null;
  lastRefreshAttempt: number | null;
  stateHistory: StateTransition[];
  pendingCleanup: (() => void)[];
  
  setState: (state: AuthState) => void;
  setError: (error: Error | null) => void;
  acquireInitLock: () => boolean;
  acquireRefreshLock: () => boolean;
  releaseInitLock: () => void;
  releaseRefreshLock: () => void;
  addCleanupTask: (task: () => void) => void;
  executeCleanup: () => void;
  resetState: () => void;
}

const INIT_COOLDOWN = 2000; // 2 seconds
const REFRESH_COOLDOWN = 1000; // 1 second
const MAX_HISTORY = 10;

const isValidTransition = (from: AuthState, to: AuthState): boolean => {
  const validTransitions: Record<AuthState, AuthState[]> = {
    IDLE: ['INITIALIZING', 'ERROR'],
    INITIALIZING: ['AUTHENTICATED', 'UNAUTHENTICATED', 'ERROR'],
    AUTHENTICATED: ['TOKEN_REFRESH_NEEDED', 'UNAUTHENTICATED', 'ERROR'],
    UNAUTHENTICATED: ['INITIALIZING', 'ERROR'],
    TOKEN_REFRESH_NEEDED: ['TOKEN_REFRESHING', 'ERROR'],
    TOKEN_REFRESHING: ['AUTHENTICATED', 'TOKEN_REFRESH_FAILED', 'ERROR'],
    TOKEN_REFRESH_FAILED: ['TOKEN_REFRESHING', 'UNAUTHENTICATED', 'ERROR'],
    ERROR: ['IDLE', 'UNAUTHENTICATED'],
  };

  return validTransitions[from]?.includes(to) ?? false;
};

export const useAuthStateMachine = create<AuthStateMachine>((set, get) => ({
  state: 'IDLE',
  error: null,
  initializationLock: false,
  lastInitAttempt: null,
  lastRefreshAttempt: null,
  stateHistory: [],
  pendingCleanup: [],

  setState: (newState) => {
    const currentState = get().state;
    
    if (currentState === newState) {
      return;
    }

    if (!isValidTransition(currentState, newState)) {
      console.error(`Invalid state transition: ${currentState} -> ${newState}`);
      return;
    }

    // Execute cleanup tasks before state change
    get().executeCleanup();

    set((state) => ({
      state: newState,
      stateHistory: [
        { from: state.state, to: newState, timestamp: Date.now() },
        ...state.stateHistory,
      ].slice(0, MAX_HISTORY),
    }));

    if (import.meta.env.PROD) {
      Sentry.addBreadcrumb({
        category: 'auth',
        message: `State transition: ${currentState} -> ${newState}`,
        level: 'info',
      });
    }
  },
  
  setError: (error) => {
    set({ error });
    if (error && import.meta.env.PROD) {
      Sentry.captureException(error, {
        tags: { state: get().state },
        extra: { stateHistory: get().stateHistory },
      });
    }
  },

  acquireInitLock: () => {
    const { initializationLock, lastInitAttempt } = get();
    const now = Date.now();

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

  acquireRefreshLock: () => {
    const { lastRefreshAttempt } = get();
    const now = Date.now();

    if (lastRefreshAttempt && (now - lastRefreshAttempt) < REFRESH_COOLDOWN) {
      return false;
    }

    set({ lastRefreshAttempt: now });
    return true;
  },

  releaseInitLock: () => {
    set({ initializationLock: false });
  },

  releaseRefreshLock: () => {
    set({ lastRefreshAttempt: null });
  },

  addCleanupTask: (task) => {
    set((state) => ({
      pendingCleanup: [...state.pendingCleanup, task],
    }));
  },

  executeCleanup: () => {
    const { pendingCleanup } = get();
    pendingCleanup.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    set({ pendingCleanup: [] });
  },

  resetState: () => {
    get().executeCleanup();
    set({
      state: 'IDLE',
      error: null,
      initializationLock: false,
      lastInitAttempt: null,
      lastRefreshAttempt: null,
      stateHistory: [],
      pendingCleanup: [],
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