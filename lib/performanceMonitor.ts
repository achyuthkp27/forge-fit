import { PerformanceObserver } from 'react-native-performance';
import { Platform } from 'react-native';

/**
 * Performance monitoring utility for ForgeFit app
 * Tracks key performance metrics and provides debugging information in development
 */

let observer: PerformanceObserver | null = null;

/**
 * Initialize performance monitoring
 * Should be called once during app startup
 */
export const initializePerformanceMonitoring = () => {
  if (__DEV__ && Platform.OS !== 'web') {
    try {
      // Create a performance observer to monitor key metrics
      observer = new PerformanceObserver((list: any) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          // Log long tasks (>50ms) which can cause jank
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            console.warn('[Performance] Long task detected:', {
              duration: entry.duration.toFixed(2),
              name: entry.name,
              startTime: entry.startTime.toFixed(2),
            });
          }
          
          // Log slow renders (>100ms)
          if (entry.entryType === 'render' && entry.duration > 100) {
            console.warn('[Performance] Slow render detected:', {
              duration: entry.duration.toFixed(2),
              name: entry.name,
            });
          }
        }
      });

      // Observe long tasks and renders
      observer.observe({ entryTypes: ['longtask', 'render'] });
      
      console.info('[Performance] Monitoring initialized');
    } catch (error) {
      console.warn('[Performance] Failed to initialize monitoring:', error);
    }
  }
};

/**
 * Measure the performance of a specific operation
 * @param name - Name of the operation to measure
 * @param callback - Function to execute and measure
 * @returns Promise resolving to the callback result
 */
export const measurePerformance = async <T>(
  name: string,
  callback: () => Promise<T> | T
): Promise<T> => {
  if (!__DEV__) {
    // In production, just execute the callback without measurement
    return await callback();
  }

  const start = performance.now();
  try {
    const result = await callback();
    const end = performance.now();
    const duration = end - start;
    
    // Log slow operations (>500ms)
    if (duration > 500) {
      console.warn(`[Performance] Slow operation '${name}': ${duration.toFixed(2)}ms`);
    } else if (duration > 100) {
      console.info(`[Performance] Operation '${name}': ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    console.error(`[Performance] Operation '${name}' failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

/**
 * Clean up performance monitoring
 * Should be called when unmounting or before app termination
 */
export const cleanupPerformanceMonitoring = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.info('[Performance] Monitoring cleaned up');
  }
};