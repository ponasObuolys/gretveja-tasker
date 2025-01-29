import { AuthState } from '../types/authTypes';

const validTransitions: Record<AuthState, AuthState[]> = {
  IDLE: ['INITIALIZING', 'ERROR'],
  INITIALIZING: ['AUTHENTICATED', 'UNAUTHENTICATED', 'LOCKED', 'TIMEOUT', 'ERROR'],
  AUTHENTICATED: ['TOKEN_REFRESH_NEEDED', 'UNAUTHENTICATED', 'ERROR'],
  UNAUTHENTICATED: ['INITIALIZING', 'ERROR'],
  TOKEN_REFRESH_NEEDED: ['TOKEN_REFRESHING', 'ERROR'],
  TOKEN_REFRESHING: ['AUTHENTICATED', 'TOKEN_REFRESH_FAILED', 'ERROR'],
  TOKEN_REFRESH_FAILED: ['TOKEN_REFRESHING', 'UNAUTHENTICATED', 'ERROR'],
  LOCKED: ['INITIALIZING', 'UNAUTHENTICATED', 'ERROR'],
  TIMEOUT: ['INITIALIZING', 'UNAUTHENTICATED', 'ERROR'],
  ERROR: ['IDLE', 'UNAUTHENTICATED'],
};

export const isValidTransition = (from: AuthState, to: AuthState): boolean => {
  return validTransitions[from]?.includes(to) ?? false;
};

export const INIT_COOLDOWN = 2000; // 2 seconds
export const REFRESH_COOLDOWN = 1000; // 1 second
export const MAX_HISTORY = 10;