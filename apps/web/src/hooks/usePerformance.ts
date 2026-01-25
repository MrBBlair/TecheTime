import { useEffect } from 'react';

/**
 * Performance optimization hook
 * Prevents layout shifts and improves perceived performance
 * Note: Logo preload is handled in index.html for immediate loading
 */
export function usePerformance() {
  // Hook reserved for future performance optimizations
  // Logo preload moved to index.html to avoid unused preload warnings
}

/**
 * Hook to measure and log performance metrics
 */
export function usePerformanceMetrics(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        console.log(`${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
      };
    }
  }, [componentName]);
}
