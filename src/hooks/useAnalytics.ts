import { useCallback } from 'react';
import { withRetry, defaultRetryConfig, globalRequestQueue } from '@/utils/requestUtils';
import { useResourceMonitor } from '@/utils/resourceMonitor';
import * as Sentry from '@sentry/react';

interface AnalyticsEvent {
  type: string;
  data: Record<string, any>;
  timestamp?: number;
}

const ANALYTICS_CACHE_KEY = 'analytics_events_cache';
const MAX_CACHE_SIZE = 100;

const getEventCache = (): AnalyticsEvent[] => {
  try {
    const cached = localStorage.getItem(ANALYTICS_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error reading analytics cache:', error);
    return [];
  }
};

const saveEventCache = (events: AnalyticsEvent[]) => {
  try {
    localStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(events.slice(-MAX_CACHE_SIZE)));
  } catch (error) {
    console.error('Error saving analytics cache:', error);
  }
};

export const useAnalytics = () => {
  const resourceMonitor = useResourceMonitor();

  const trackEvent = useCallback(async (event: Omit<AnalyticsEvent, 'timestamp'>) => {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };

    const sendEvent = async () => {
      try {
        resourceMonitor.setLoading('analytics', true);
        
        // Simulate API call - replace with your actual analytics API
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullEvent),
        });

        // Process cached events if any
        const cachedEvents = getEventCache();
        if (cachedEvents.length > 0) {
          await Promise.all(
            cachedEvents.map(async (cachedEvent) => {
              try {
                await fetch('/api/analytics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(cachedEvent),
                });
              } catch (error) {
                throw error;
              }
            })
          );
          saveEventCache([]);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('429')) {
          const cachedEvents = getEventCache();
          saveEventCache([...cachedEvents, fullEvent]);
          throw error;
        }
        if (import.meta.env.PROD) {
          Sentry.captureException(error, {
            extra: { eventType: event.type },
          });
        }
        throw error;
      } finally {
        resourceMonitor.setLoading('analytics', false);
      }
    };

    return globalRequestQueue.add(() =>
      withRetry(sendEvent, {
        ...defaultRetryConfig,
        maxRetries: 5,
        maxDelay: 30000,
      })
    );
  }, [resourceMonitor]);

  return {
    trackEvent,
    isTracking: resourceMonitor.getLoadingState('analytics'),
    error: resourceMonitor.getError('analytics'),
  };
}; 