import { useEffect, useRef } from 'react';

export const useResizeObserver = (
  callback: (entries: ResizeObserverEntry[]) => void,
  element: Element | null
) => {
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!element) return;

    try {
      observer.current = new ResizeObserver((entries) => {
        window.requestAnimationFrame(() => {
          try {
            callback(entries);
          } catch (error) {
            console.error('ResizeObserver callback error:', error);
          }
        });
      });

      observer.current.observe(element);
    } catch (error) {
      console.error('ResizeObserver initialization error:', error);
    }

    return () => {
      if (observer.current) {
        try {
          observer.current.disconnect();
        } catch (error) {
          console.error('ResizeObserver cleanup error:', error);
        }
      }
    };
  }, [callback, element]);
};

export const createSafeResizeObserver = (
  callback: (entries: ResizeObserverEntry[]) => void
): ResizeObserver | null => {
  try {
    return new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        try {
          callback(entries);
        } catch (error) {
          console.error('ResizeObserver callback error:', error);
        }
      });
    });
  } catch (error) {
    console.error('ResizeObserver creation error:', error);
    return null;
  }
}; 