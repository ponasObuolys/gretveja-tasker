export type AuthState = 
  | 'IDLE' 
  | 'INITIALIZING' 
  | 'AUTHENTICATED' 
  | 'UNAUTHENTICATED' 
  | 'TOKEN_REFRESH_NEEDED'
  | 'TOKEN_REFRESHING'
  | 'TOKEN_REFRESH_FAILED'
  | 'LOCKED'
  | 'TIMEOUT'
  | 'ERROR';

export type StateTransition = {
  from: AuthState;
  to: AuthState;
  timestamp: number;
};

export interface AuthStateMachine {
  state: AuthState;
  error: Error | null;
  initializationLock: boolean;
  lastInitAttempt: number | null;
  lastRefreshAttempt: number | null;
  stateHistory: StateTransition[];
  pendingCleanup: (() => void)[];
  subscriptions: (() => void)[];
  isCleaningUp: boolean;
  
  setState: (state: AuthState) => void;
  setError: (error: Error | null) => void;
  acquireInitLock: () => boolean;
  acquireRefreshLock: () => boolean;
  releaseInitLock: () => void;
  releaseRefreshLock: () => void;
  addCleanupTask: (task: () => void) => void;
  executeCleanup: () => void;
  resetState: () => void;
  addSubscription: (unsubscribe: () => void) => void;
  clearSubscriptions: () => void;
}