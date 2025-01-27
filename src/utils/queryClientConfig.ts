import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          // Don't retry more than 3 times for auth or fetch errors
          if (error.message.includes('Auth') || error.message.includes('Failed to fetch')) {
            return failureCount < 3;
          }
          // For rate limiting (429), don't retry
          if (error.message.includes('429')) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // Implement exponential backoff
        return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});