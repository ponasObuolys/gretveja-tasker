import * as Sentry from "@sentry/react";

export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    
    // Set sample rate to 0.1 (10% of errors)
    sampleRate: 0.1,
    
    // Enable error event batching
    maxBreadcrumbs: 50,
    autoSessionTracking: true,
    
    // Add circuit breaker configuration
    maxValueLength: 250,
    normalizeDepth: 5,
    
    // Configure transport options for batching
    transport: Sentry.makeXHRTransport({
      // Batch events and send them every 30 seconds or when reaching 30 events
      bufferSize: 30,
      flushTimeout: 30000,
      
      // Implement rate limiting
      rateLimits: {
        error: 100, // Max 100 errors per minute
        transaction: 50, // Max 50 transactions per minute
      },
    }),
    
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        return null;
      }
      return event;
    },
  });
};