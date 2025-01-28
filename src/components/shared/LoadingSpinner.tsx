import { memo, useEffect, useRef, useCallback } from 'react';
import { useResizeObserver } from '@/utils/resizeObserver';
import { cn } from '@/lib/utils';

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

export const LoadingSpinner = memo(function LoadingSpinner({
  className,
  size = 'md',
  fullscreen = false,
}: LoadingSpinnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mountedRef = useRef(true);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!mountedRef.current || !svgRef.current) return;
    
    const entry = entries[0];
    if (entry) {
      const { width, height } = entry.contentRect;
      requestAnimationFrame(() => {
        if (mountedRef.current && svgRef.current) {
          svgRef.current.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
      });
    }
  }, []);

  useResizeObserver(handleResize, containerRef.current);

  useEffect(() => {
    mountedRef.current = true;
    const svg = svgRef.current;
    
    if (!svg) return;

    // Ensure SVG is properly mounted before animation
    const animationFrame = requestAnimationFrame(() => {
      if (mountedRef.current && svg) {
        svg.style.opacity = '1';
      }
    });

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(animationFrame);
      if (svg && svg.parentNode) {
        svg.style.opacity = '0';
      }
    };
  }, []);

  const spinnerContent = (
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
        className="animate-spin opacity-0 transition-opacity duration-200"
        style={{ 
          width: '100%',
          height: '100%',
        }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
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

  if (fullscreen) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="alert"
        aria-busy="true"
      >
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
});