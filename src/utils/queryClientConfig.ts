import { QueryClient } from "@tanstack/react-query";
import { withRetry, defaultRetryConfig } from './requestUtils';
import { useConnectionState } from './connectionState';
import * as Sentry from '@sentry/react';

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          const connectionState = useConnectionState.getState();
          
          // Don't retry if we're offline
          if (!connectionState.isOnline) return false;
          
          // Always retry on network errors
          if (error?.message?.includes('Network Error')) return true;
          
          // Retry on rate limits with exponential backoff
          if (error?.response?.status === 429) return true;
          
          // Default retry logic
          return failureCount < defaultRetryConfig.maxRetries;
        },
        retryDelay: (attemptIndex) => {
          const delay = Math.min(
            defaultRetryConfig.initialDelay * Math.pow(defaultRetryConfig.backoffFactor, attemptIndex),
            defaultRetryConfig.maxDelay
          );
          return delay;
        },
        gcTime: 10 * 60 * 1000, // 10 minutes
        staleTime: 5 * 60 * 1000, // 5 minutes
        onError: (error: any) => {
          if (import.meta.env.PROD) {
            Sentry.captureException(error, {
              extra: {
                message: error.message,
                status: error?.response?.status,
              },
            });
          } else {
            console.error('Query error:', error);
          }
        },
      },
      mutations: {
        retry: (failureCount, error: any) => {
          const connectionState = useConnectionState.getState();
          
          // Don't retry if we're offline
          if (!connectionState.isOnline) return false;
          
          // Always retry on network errors
          if (error?.message?.includes('Network Error')) return true;
          
          // Retry on rate limits
          if (error?.response?.status === 429) return true;
          
          // Default retry logic
          return failureCount < defaultRetryConfig.maxRetries;
        },
        onError: (error: any) => {
          if (import.meta.env.PROD) {
            Sentry.captureException(error, {
              extra: {
                message: error.message,
                status: error?.response?.status,
              },
            });
          } else {
            console.error('Mutation error:', error);
          }
        },
      },
    },
  });
};