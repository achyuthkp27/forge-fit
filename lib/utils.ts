/**
 * Reusable utility functions for the ForgeFit app
 */

// Plate calculator for weight lifting
export interface PlateResult {
  platesPerSide: number[];
  totalWeight: number;
}

// Available plate weights in lbs
const AVAILABLE_PLATES = [45, 35, 25, 10, 5, 2.5];

// Color mapping for plates
export const PLATE_COLORS: Record<number, string> = {
  45: '#EF4444',
  35: '#F97316',
  25: '#22C55E',
  10: '#3B82F6',
  5: '#EAB308',
  2.5: '#71717A',
};

/**
 * Calculate plates needed to reach target weight
 * @param targetWeight - Target total weight (including bar)
 * @param barWeight - Weight of the bar (default 45 lbs)
 */
export function calculatePlates(targetWeight: number, barWeight: number = 45): PlateResult {
  const weightPerSide = (targetWeight - barWeight) / 2;
  const plates: number[] = [];
  let remaining = weightPerSide;

  for (const plate of AVAILABLE_PLATES) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining -= plate;
    }
  }

  return { platesPerSide: plates, totalWeight: targetWeight };
}

/**
 * Get color for a plate weight
 */
export function getPlateColor(weight: number): string {
  return PLATE_COLORS[weight] || '#71717A';
}

// Time formatting utilities

/**
 * Format seconds into MM:SS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Date calculations

/**
 * Calculate days since a given date
 */
export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get relative time text (e.g., "2d ago", "Yesterday")
 */
export function getRelativeTimeText(date: Date): string {
  const days = daysSince(date);
  if (days === 0) return 'Done today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

// Workout statistics

/**
 * Calculate workout streak
 */
export function calculateStreak(sessions: { startTime: Date }[]): number {
  if (sessions.length === 0) return 0;

  const sortedDates = sessions
    .map(s => new Date(s.startTime).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index) // unique dates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  // Check if the most recent workout was today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const prevDate = i > 0 ? new Date(sortedDates[i - 1]) : null;

    if (prevDate && (currentDate.getTime() - prevDate.getTime()) === 86400000) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return Math.min(streak + 1, 30);
}

/**
 * Count workouts in the last N days
 */
export function getWorkoutsLastDays(sessions: { startTime: Date }[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return sessions.filter(s => new Date(s.startTime) >= cutoff).length;
}

// Number formatting

/**
 * Format number with comma separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}