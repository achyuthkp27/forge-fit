/**
 * Crash Monitoring Service for ForgeFit
 *
 * Captures, logs, and persists crash reports locally.
 * Designed to work with ErrorBoundary and external services (Sentry, Crashlytics).
 *
 * Architecture:
 * - Captures errors from ErrorBoundary and manual catches
 * - Persists crash logs to AsyncStorage (survives app restarts)
 * - Batches reports for background upload when online
 * - Respects user privacy (opt-in for remote reporting)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Types ─────────────────────────────────────────────

export interface CrashReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
    name?: string;
  };
  context: string;          // Where the error occurred (e.g., "WorkoutScreen", "ErrorBoundary")
  appState: {
    version: string;
    platform: string;
    osVersion: string;
    isDarkMode: boolean;
    isOnline: boolean;
  };
  userAction?: string;      // What the user was doing (e.g., "logging set", "creating workout")
  breadcrumbs: Breadcrumb[];
  status: 'pending' | 'sent' | 'failed';
}

export interface Breadcrumb {
  timestamp: string;
  type: 'navigation' | 'action' | 'error' | 'info';
  label: string;
  data?: Record<string, unknown>;
}

// ─── Constants ─────────────────────────────────────────

const STORAGE_KEY = '@forgefit_crash_reports';
const MAX_STORED_REPORTS = 50;
const BATCH_SIZE = 5;

// ─── Internal State ────────────────────────────────────

let appState: {
  version: string;
  platform: string;
  isDarkMode: boolean;
} = {
  version: '1.0.0',
  platform: Platform.OS,
  isDarkMode: true,
};

let breadcrumbs: Breadcrumb[] = [];

// ─── Core Functions ────────────────────────────────────

/**
 * Initialize crash monitoring with app metadata
 */
export function initializeCrashMonitoring(options?: {
  version?: string;
  platform?: string;
  isDarkMode?: boolean;
}): void {
  if (options) {
    appState = { ...appState, ...options };
  }
  // Clear old crash reports on fresh start
  clearOldReports();
}

/**
 * Log a crash/error for monitoring
 */
export async function logCrash(
  error: Error | string,
  context: string,
  userAction?: string
): Promise<void> {
  try {
    const report: CrashReport = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      error: typeof error === 'string'
        ? { message: error }
        : {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
      context,
      appState: {
        ...appState,
        osVersion: Platform.Version?.toString() || 'unknown',
        isOnline: true, // Would integrate with NetInfo in production
        isDarkMode: appState.isDarkMode,
      },
      userAction,
      breadcrumbs: getRecentBreadcrumbs(20),
      status: 'pending',
    };

    await persistReport(report);

    // Log to console in dev
    if (__DEV__) {
      console.group(`[CrashMonitor] ${context}`);
      console.error('Error:', error);
      console.log('Report ID:', report.id);
      console.log('Breadcrumbs:', report.breadcrumbs);
      console.groupEnd();
    }
  } catch (storageError) {
    // Fail silently — crash monitoring should never crash the app
    if (__DEV__) {
      console.warn('[CrashMonitor] Failed to persist crash report:', storageError);
    }
  }
}

/**
 * Log a caught error (non-fatal) for diagnostics
 */
export function logError(error: Error | string, context: string): void {
  // Non-async version for convenience — fires and forgets
  logCrash(error, context).catch(() => {});
}

/**
 * Add a breadcrumb to track user journey before crashes
 */
export function addBreadcrumb(
  type: Breadcrumb['type'],
  label: string,
  data?: Record<string, unknown>
): void {
  breadcrumbs.push({
    timestamp: new Date().toISOString(),
    type,
    label,
    data,
  });

  // Keep only last 50 breadcrumbs to avoid memory bloat
  if (breadcrumbs.length > 50) {
    breadcrumbs = breadcrumbs.slice(-50);
  }
}

/**
 * Get recent breadcrumbs for crash context
 */
function getRecentBreadcrumbs(maxCount: number): Breadcrumb[] {
  return breadcrumbs.slice(-maxCount);
}

/**
 * Persist crash report to AsyncStorage
 */
async function persistReport(report: CrashReport): Promise<void> {
  const existing = await getStoredReports();
  const updated = [report, ...existing].slice(0, MAX_STORED_REPORTS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Get all stored crash reports
 */
export async function getStoredReports(): Promise<CrashReport[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Get pending reports (for sync)
 */
export async function getPendingReports(): Promise<CrashReport[]> {
  const reports = await getStoredReports();
  return reports.filter(r => r.status === 'pending');
}

/**
 * Mark reports as sent after successful upload
 */
export async function markReportsSent(reportIds: string[]): Promise<void> {
  const reports = await getStoredReports();
  const updated = reports.map(r =>
    reportIds.includes(r.id) ? { ...r, status: 'sent' } : r
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Clear old/stale reports
 */
async function clearOldReports(): Promise<void> {
  try {
    const reports = await getStoredReports();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = reports.filter(r => new Date(r.timestamp).getTime() > oneWeekAgo);
    if (recent.length !== reports.length) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    }
  } catch {
    // Fail silently
  }
}

/**
 * Clear all crash reports (useful for testing or user request)
 */
export async function clearAllReports(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  breadcrumbs = [];
}

/**
 * Get crash summary for debugging
 */
export async function getCrashSummary(): Promise<{
  total: number;
  pending: number;
  recentErrors: Array<{ message: string; context: string; timestamp: string }>;
}> {
  const reports = await getStoredReports();
  return {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    recentErrors: reports.slice(0, 10).map(r => ({
      message: r.error.message,
      context: r.context,
      timestamp: r.timestamp,
    })),
  };
}

// ─── Helpers ───────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Setup Helper for Root Component ───────────────────

/**
 * Call this in _layout.tsx to wire crash monitoring
 * into the ErrorBoundary
 */
export function setupCrashMonitoring(): void {
  // Import and set the crash logger used by ErrorBoundary
  const { setCrashLogger } = require('../components/ErrorBoundary');
  setCrashLogger(logCrash);
}