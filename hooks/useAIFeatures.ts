import { getDb } from '../lib/db';

export interface OverloadSuggestion {
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
}

export async function checkProgressiveOverload(): Promise<OverloadSuggestion[]> {
  const db = await getDb();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const sessions = await db.getAllAsync<{
    id: string;
    workout_name: string;
    finished_at: string;
  }>(`
    SELECT id, workout_name, finished_at FROM sessions
    WHERE status = 'completed' AND finished_at >= ?
    ORDER BY finished_at DESC
  `, [twoWeeksAgo.toISOString()]);

  if (sessions.length < 2) return [];

  const sets = await db.getAllAsync<{
    exercise_id: string;
    weight: number;
    reps: number;
    completed: number;
  }>(`
    SELECT exercise_id, weight, reps, completed FROM session_sets
    WHERE session_id IN (${sessions.slice(0, 4).map(s => `'${s.id}'`).join(',')})
  `);

  const exerciseStats: Record<string, { weights: number[]; reps: number[]; sessions: number }> = {};
  
  for (const set of sets) {
    if (!set.completed) continue;
    if (!exerciseStats[set.exercise_id]) {
      exerciseStats[set.exercise_id] = { weights: [], reps: [], sessions: 0 };
    }
    exerciseStats[set.exercise_id].weights.push(set.weight);
    exerciseStats[set.exercise_id].reps.push(set.reps);
    exerciseStats[set.exercise_id].sessions++;
  }

  const suggestions: OverloadSuggestion[] = [];
  const exerciseNames: Record<string, string> = {
    '1': 'Bench Press',
    '15': 'Squat',
    '6': 'Deadlift',
    '11': 'Overhead Press',
  };

  for (const [exerciseId, stats] of Object.entries(exerciseStats)) {
    if (stats.sessions < 2) continue;
    
    const avgWeight = stats.weights.reduce((a, b) => a + b, 0) / stats.weights.length;
    const avgReps = stats.reps.reduce((a, b) => a + b, 0) / stats.reps.length;
    
    if (avgReps >= 8 && avgWeight > 0) {
      const suggestedWeight = Math.round(avgWeight + 2.5);
      suggestions.push({
        exerciseName: exerciseNames[exerciseId] || `Exercise ${exerciseId}`,
        currentWeight: Math.round(avgWeight),
        suggestedWeight,
        reason: `Hit ${Math.round(avgReps)} reps average in ${stats.sessions} sessions`,
      });
    }
  }

  return suggestions.slice(0, 3);
}

export interface WeeklyStats {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  workoutsCompleted: string[];
  prsHit: string[];
  streakDays: number;
}

export async function getWeeklySummary(): Promise<WeeklyStats> {
  const db = await getDb();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sessions = await db.getAllAsync<{
    id: string;
    workout_name: string;
    finished_at: string;
  }>(`
    SELECT id, workout_name, finished_at FROM sessions
    WHERE status = 'completed' AND finished_at >= ?
    ORDER BY finished_at DESC
  `, [weekAgo.toISOString()]);

  const sets = await db.getAllAsync<{
    weight: number;
    reps: number;
    completed: number;
  }>(`
    SELECT weight, reps, completed FROM session_sets
    WHERE session_id IN (${sessions.map(s => `'${s.id}'`).join(',') || "''"})
  `);

  const prs = await db.getAllAsync<{
    exercise_name: string;
    date: string;
  }>(`
    SELECT exercise_name, date FROM personal_records
    WHERE date >= ?
  `, [weekAgo.toISOString()]);

  let totalSets = 0;
  let totalVolume = 0;
  for (const set of sets) {
    if (set.completed) {
      totalSets++;
      totalVolume += set.weight * set.reps;
    }
  }

  const streakDays = 0;

  return {
    totalWorkouts: sessions.length,
    totalSets,
    totalVolume,
    workoutsCompleted: sessions.map(s => s.workout_name),
    prsHit: prs.map(p => p.exercise_name),
    streakDays,
  };
}

export interface WorkoutModification {
  setsAdjustment: number;
  repsAdjustment: number;
  intensityLevel: 'light' | 'moderate' | 'intense';
  recommendation: string;
}

export function adjustWorkoutForMood(mood: 'low' | 'neutral' | 'high'): WorkoutModification {
  switch (mood) {
    case 'low':
      return {
        setsAdjustment: -1,
        repsAdjustment: 0,
        intensityLevel: 'light',
        recommendation: 'Lower volume day - focus on form over intensity. Cut one set from each exercise.',
      };
    case 'neutral':
      return {
        setsAdjustment: 0,
        repsAdjustment: 0,
        intensityLevel: 'moderate',
        recommendation: 'Standard workout - maintain your usual intensity.',
      };
    case 'high':
      return {
        setsAdjustment: 1,
        repsAdjustment: 1,
        intensityLevel: 'intense',
        recommendation: 'Great energy day! Add an extra set and push for one more rep than usual.',
      };
  }
}