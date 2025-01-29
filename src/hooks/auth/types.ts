export type AuthState = {
  state: 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';
  error: Error | null;
  setState: (state: 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED') => void;
  setError: (error: Error | null) => void;
  executeCleanup: () => void;
};