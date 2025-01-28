import { memo, useEffect, useRef, useCallback, useState } from 'react';
import { useResizeObserver } from '@/utils/resizeObserver';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { featureDetector, safeRequestAnimationFrame, safeCancelAnimationFrame } from '@/utils/featureDetection';

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

const SpinnerContent = memo(function SpinnerContent({
  className,
  size = 'md',
}: Omit<LoadingSpinnerProps, 'fullscreen'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mountedRef = useRef(true);
  const [isVisible, setIsVisible] = useState(false);
  const [hasResizeObserver] = useState(() => featureDetector.hasResizeObserver());

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!mountedRef.current || !svgRef.current) return;
    
    const entry = entries[0];
    if (entry) {
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return; // Skip invalid dimensions
      
      safeRequestAnimationFrame(() => {
        if (mountedRef.current && svgRef.current) {
          svgRef.current.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
      });
    }
  }, []);

  const handleManualResize = useCallback(() => {
    if (!mountedRef.current || !svgRef.current || !containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    safeRequestAnimationFrame(() => {
      if (mountedRef.current && svgRef.current) {
        svgRef.current.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let animationHandle: number;
    let resizeObserver: ResizeObserver | null = null;

    // Ensure component is mounted before starting animations
    Promise.resolve().then(() => {
      if (!mountedRef.current) return;

      animationHandle = safeRequestAnimationFrame(() => {
        if (mountedRef.current) {
          setIsVisible(true);
          
          // Set up manual resize handling if ResizeObserver is not available
          if (!hasResizeObserver) {
            window.addEventListener('resize', handleManualResize);
            handleManualResize();
          }
        }
      });
    });

    return () => {
      mountedRef.current = false;
      if (animationHandle) {
        safeCancelAnimationFrame(animationHandle);
      }
      if (!hasResizeObserver) {
        window.removeEventListener('resize', handleManualResize);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      setIsVisible(false);
    };
  }, [hasResizeObserver, handleManualResize]);

  // Only use ResizeObserver if it's available
  if (hasResizeObserver) {
    useResizeObserver(handleResize, containerRef.current);
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <svg
        ref={svgRef}
        className={cn(
          'transition-opacity duration-200',
          isVisible ? 'opacity-100 animate-spin' : 'opacity-0'
        )}
        style={{ 
          width: '100%',
          height: '100%',
        }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
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
        role="alert"
        aria-busy="true"
        data-testid="fullscreen-spinner"
      >
        {content}
      </div>
    );
  }

  return content;
});