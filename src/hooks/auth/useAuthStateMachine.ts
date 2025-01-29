import { create } from 'zustand';
import * as Sentry from '@sentry/react';
import { AuthStateMachine, AuthState, StateTransition } from './types/authTypes';
import { isValidTransition, INIT_COOLDOWN, REFRESH_COOLDOWN, MAX_HISTORY } from './utils/stateTransitions';
import { executeCleanup } from './utils/cleanupManager';

export const useAuthStateMachine = create<AuthStateMachine>((set, get) => ({
  state: 'IDLE',
  error: null,
  initializationLock: false,
  lastInitAttempt: null,
  lastRefreshAttempt: null,
  stateHistory: [],
  pendingCleanup: [],
  subscriptions: [],
  isCleaningUp: false,

  setState: (newState) => {
    const currentState = get().state;
    
    if (currentState === newState || get().isCleaningUp) {
      return;
    }

    if (!isValidTransition(currentState, newState)) {
      console.error(`Invalid state transition: ${currentState} -> ${newState}`);
      return;
    }

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
    if (get().isCleaningUp) return;
    set({ error });
    if (error && import.meta.env.PROD) {
      Sentry.captureException(error, {
        tags: { state: get().state },
        extra: { stateHistory: get().stateHistory },
      });
    }
  },

  acquireInitLock: () => {
    const { initializationLock, lastInitAttempt, isCleaningUp } = get();
    if (isCleaningUp) return false;
    
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
    if (get().isCleaningUp) return false;
    const { lastRefreshAttempt } = get();
    const now = Date.now();

    if (lastRefreshAttempt && (now - lastRefreshAttempt) < REFRESH_COOLDOWN) {
      return false;
    }
    set({ lastRefreshAttempt: now });
    return true;
  },

  releaseInitLock: () => {
    if (get().isCleaningUp) return;
    set({ initializationLock: false });
  },

  releaseRefreshLock: () => {
    if (get().isCleaningUp) return;
    set({ lastRefreshAttempt: null });
  },

  addCleanupTask: (task) => {
    if (get().isCleaningUp) return;
    set((state) => ({
      pendingCleanup: [...state.pendingCleanup, task],
    }));
  },

  executeCleanup: () => {
    const state = get();
    if (state.isCleaningUp) return;
    set({ isCleaningUp: true });
    executeCleanup(state);
  },

  resetState: () => {
    const state = get();
    if (state.isCleaningUp) return;
    
    state.executeCleanup();
    
    set({
      state: 'IDLE',
      error: null,
      initializationLock: false,
      lastInitAttempt: null,
      lastRefreshAttempt: null,
      stateHistory: [],
      pendingCleanup: [],
      subscriptions: [],
      isCleaningUp: false
    });
  },

  addSubscription: (unsubscribe) => {
    if (get().isCleaningUp) return;
    set((state) => ({
      subscriptions: [...state.subscriptions, unsubscribe],
    }));
  },

  clearSubscriptions: () => {
    const state = get();
    if (state.isCleaningUp) return;
    state.executeCleanup();
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
    const result = await operation();
    authState.setState(finalState);
    return result;
  } catch (error) {
    authState.setState('ERROR');
    authState.setError(error as Error);
    throw error;
  }
};