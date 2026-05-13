import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import {
  logCrash,
  logError,
  addBreadcrumb,
  initializeCrashMonitoring,
  getCrashSummary,
} from '../lib/crashMonitoring';

// Wire ErrorBoundary's crash logger into the monitoring system
import { setCrashLogger } from '../components/ErrorBoundary';

/**
 * Hook for error handling and crash monitoring
 *
 * Usage in any component:
 * const { handleError, reportError, withErrorHandling } = useErrorHandler('WorkoutScreen');
 * try { ... } catch (e) { handleError(e, 'Failed to load workout'); }
 *
 * Or wrap async operations:
 * const result = await withErrorHandling(fetchWorkouts, { userAction: 'loading workouts' });
 */
export function useErrorHandler(context: string) {
  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Track app state changes for breadcrumbs
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      addBreadcrumb('info', `App state: ${state}`, { context: contextRef.current });
    });
    return () => subscription.remove();
  }, []);

  /**
   * Handle a caught error — logs it for diagnostics
   */
  const handleError = useCallback(
    (error: Error | string, userAction?: string) => {
      logCrash(error, contextRef.current, userAction);
    },
    []
  );

  /**
   * Log a non-fatal error for diagnostics
   */
  const reportError = useCallback(
    (error: Error | string, userAction?: string) => {
      logError(error, contextRef.current);
      addBreadcrumb('error', `Error in ${contextRef.current}`, {
        action: userAction,
        message: typeof error === 'string' ? error : error.message,
      });
    },
    []
  );

  /**
   * Wrap an async operation with error handling
   * Returns undefined on error, so callers can safely use the result
   */
  const withErrorHandling = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: {
        userAction?: string;
        onError?: (error: Error) => void;
      }
    ): Promise<T | undefined> => {
      const actionLabel = options?.userAction || 'operation';
      addBreadcrumb('action', `Starting: ${actionLabel}`, {
        context: contextRef.current,
      });

      try {
        return await operation();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        handleError(err, options?.userAction);
        options?.onError?.(err);
        return undefined;
      }
    },
    [handleError]
  );

  return {
    handleError,
    reportError,
    withErrorHandling,
    addBreadcrumb,
  };
}

/**
 * Global error handler setup
 * Call this once in the root layout
 *
 * Sentry integration is optional — only activates if EXPO_PUBLIC_SENTRY_DSN is set.
 * This keeps the app functional without any external service dependency.
 */
export function setupGlobalErrorHandler(): void {
  // Optional Sentry integration (only if DSN is configured)
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require('@sentry/react-native');
      Sentry.init({
        dsn: sentryDsn,
        enableTracing: true,
        tracesSampleRate: __DEV__ ? 1.0 : 0.1,
        beforeBreadcrumb(breadcrumb: any) {
          addBreadcrumb(
            breadcrumb.type || 'info',
            breadcrumb.message || '',
            breadcrumb.data
          );
          return breadcrumb;
        },
      });
    } catch {
      // Sentry not installed — skip silently
      if (__DEV__) {
        console.info('[CrashMonitor] Sentry DSN found but package not installed. Install @sentry/react-native to enable remote crash reporting.');
      }
    }
  }

  // Handle uncaught JS errors
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    logCrash(
      new Error(error?.message || 'Unknown error'),
      isFatal ? 'GlobalFatalError' : 'GlobalError',
      'Unhandled error'
    );

    // Call the original handler if it exists
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Initialize crash monitoring with app metadata
  initializeCrashMonitoring({
    version: '1.0.0',
    platform: Platform.OS,
  });

  // Wire ErrorBoundary's crash logger into the monitoring system
  setCrashLogger(logCrash);
}