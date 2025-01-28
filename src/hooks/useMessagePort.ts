import { useEffect, useRef, useCallback } from 'react';
import { withRetry, defaultRetryConfig } from '@/utils/requestUtils';
import { useResourceMonitor } from '@/utils/resourceMonitor';
import * as Sentry from '@sentry/react';

interface MessagePortConfig {
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: Error) => void;
  retryConfig?: typeof defaultRetryConfig;
}

export const useMessagePort = (port: MessagePort | null, config: MessagePortConfig = {}) => {
  const { onMessage, onError, retryConfig } = config;
  const portRef = useRef<MessagePort | null>(null);
  const resourceMonitor = useResourceMonitor();

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      onMessage?.(event);
    } catch (error) {
      console.error('Error handling message:', error);
      onError?.(error as Error);
      if (import.meta.env.PROD) {
        Sentry.captureException(error, {
          extra: { messageType: event.data?.type },
        });
      }
    }
  }, [onMessage, onError]);

  const postMessage = useCallback(async (message: any) => {
    if (!portRef.current) {
      throw new Error('MessagePort not initialized');
    }

    const sendMessage = () => new Promise<void>((resolve, reject) => {
      try {
        portRef.current?.postMessage(message);
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    return withRetry(sendMessage, retryConfig);
  }, [retryConfig]);

  useEffect(() => {
    if (!port) return;

    portRef.current = port;
    const currentPort = port;

    const setupPort = async () => {
      try {
        resourceMonitor.setLoading('messagePort', true);
        currentPort.start();
        currentPort.addEventListener('message', handleMessage);
        currentPort.addEventListener('messageerror', (event) => {
          const error = new Error('MessagePort error: ' + event.type);
          onError?.(error);
          if (import.meta.env.PROD) {
            Sentry.captureException(error);
          }
        });
      } catch (error) {
        console.error('Error setting up MessagePort:', error);
        onError?.(error as Error);
        if (import.meta.env.PROD) {
          Sentry.captureException(error);
        }
      } finally {
        resourceMonitor.setLoading('messagePort', false);
      }
    };

    setupPort();

    return () => {
      currentPort.removeEventListener('message', handleMessage);
      currentPort.close();
      portRef.current = null;
    };
  }, [port, handleMessage, onError, resourceMonitor]);

  return {
    postMessage,
    isConnected: !!portRef.current,
    isLoading: resourceMonitor.getLoadingState('messagePort'),
    error: resourceMonitor.getError('messagePort'),
  };
}; 