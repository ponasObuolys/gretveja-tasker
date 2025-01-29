import { AuthStateMachine } from '../types/authTypes';

export const executeCleanup = (state: AuthStateMachine) => {
  if (state.isCleaningUp) return;

  try {
    state.pendingCleanup.forEach((task) => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    
    state.subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Subscription cleanup failed:', error);
      }
    });
  } finally {
    state.pendingCleanup = [];
    state.subscriptions = [];
    state.isCleaningUp = false;
  }
};