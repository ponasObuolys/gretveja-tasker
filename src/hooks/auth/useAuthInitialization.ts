import { useEffect, useRef } from 'react';
import { AuthState } from './types';
import { clearSession } from '@/utils/sessionUtils';

const RETRY_DELAY = 2000;
const MAX_RETRIES = 3;

interface UseAuthInitializationProps {
  authState: AuthState;
  initialize: () => Promise<void>;
}

export const useAuthInitialization = ({ 
  authState, 
  initialize 
}: UseAuthInitializationProps) => {
  const retryCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    console.log('Starting auth initialization effect');

    const initAuth = async () => {
      if (!mounted.current) {
        console.log('Component unmounted, stopping initialization');
        return;
      }

      try {
        console.log(`Auth initialization attempt ${retryCount.current + 1}`);
        await initialize();
        console.log('Auth initialization successful');
        retryCount.current = 0;
      } catch (error) {
        console.error(`Auth initialization attempt ${retryCount.current + 1} failed:`, error);
        
        // Handle refresh token not found error
        if (error instanceof Error && error.message.includes('refresh_token_not_found')) {
          console.log('Refresh token not found, clearing session');
          clearSession();
          authState.setState('UNAUTHENTICATED');
        } else if (retryCount.current < MAX_RETRIES && mounted.current) {
          retryCount.current++;
          console.log(`Retrying auth initialization in ${RETRY_DELAY}ms`);
          timeoutRef.current = setTimeout(initAuth, RETRY_DELAY);
        } else {
          console.error('Max retries reached or component unmounted');
          clearSession();
          authState.setState('UNAUTHENTICATED');
        }
      }
    };

    if (authState.state === 'INITIALIZING') {
      initAuth();
    }

    return () => {
      console.log('Cleaning up auth initialization');
      mounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      authState.executeCleanup();
      retryCount.current = 0;
    };
  }, [initialize, authState.state]);

  return {
    state: authState.state,
    error: authState.error,
    initialize,
  };
};