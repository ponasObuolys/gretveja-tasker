import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          if (error.message.includes('Auth') || error.message.includes('Failed to fetch')) {
            return failureCount < 3;
          }
          if (error.message.includes('429')) {
            // Implement exponential backoff for rate limiting
            const delay = Math.min(1000 * Math.pow(2, failureCount), 30000);
            return new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});