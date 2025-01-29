import { useEffect, useRef } from 'react';
import { AuthState } from './types';
import { clearSession } from '@/utils/sessionUtils';
import { supabase } from '@/integrations/supabase/client';

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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No active session found, transitioning to UNAUTHENTICATED');
          authState.setState('UNAUTHENTICATED');
          return;
        }

        await initialize();
        console.log('Auth initialization successful');
        retryCount.current = 0;
        authState.setState('AUTHENTICATED');
      } catch (error) {
        console.error(`Auth initialization attempt ${retryCount.current + 1} failed:`, error);
        
        if (error instanceof Error && error.message.includes('refresh_token_not_found')) {
          console.log('Refresh token not found, clearing session');
          await clearSession();
          authState.setState('UNAUTHENTICATED');
        } else if (retryCount.current < MAX_RETRIES && mounted.current) {
          retryCount.current++;
          console.log(`Retrying auth initialization in ${RETRY_DELAY}ms`);
          timeoutRef.current = setTimeout(initAuth, RETRY_DELAY);
        } else {
          console.error('Max retries reached or component unmounted');
          await clearSession();
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
  }, [initialize, authState]);

  return {
    state: authState.state,
    error: authState.error,
    initialize,
  };
};