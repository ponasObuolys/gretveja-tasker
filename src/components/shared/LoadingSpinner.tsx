import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const LOADING_TIMEOUT = 3000; // 3 seconds timeout threshold

const SpinnerContent = memo(function SpinnerContent({
  className,
  size = 'md',
}: Omit<LoadingSpinnerProps, 'fullscreen'>) {
  const mountedRef = useRef(true);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setShowFallback(true);
      }
    }, LOADING_TIMEOUT);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  if (showFallback) {
    return (
      <div className="text-sm text-muted-foreground">
        Taking longer than expected...
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <svg
        className={cn(
          'animate-spin',
          'will-change-transform',
          'transform-gpu'
        )}
        style={{ 
          width: '100%',
          height: '100%',
        }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-live="polite"
        role="status"
        data-testid="loading-spinner"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
});

export const LoadingSpinner = memo(function LoadingSpinner(props: LoadingSpinnerProps) {
  const content = (
    <ErrorBoundary>
      <SpinnerContent 
        className={props.className}
        size={props.size}
      />
    </ErrorBoundary>
  );

  if (props.fullscreen) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-busy="true"
        data-testid="fullscreen-spinner"
      >
        {content}
      </div>
    );
  }

  return content;
});