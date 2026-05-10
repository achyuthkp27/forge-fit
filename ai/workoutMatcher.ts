import { getAllWorkouts } from '../lib/sessionQueries';
import type { MuscleGroup, RecoveryScore } from './recoveryEngine';

export interface WorkoutMatch {
  id: string;
  name: string;
  type: 'gym' | 'home' | 'rest';
  muscleGroups: MuscleGroup[];
  estimatedDuration: number;
  matchScore: number;
  matchReason: string;
}

export async function findBestWorkout(
  rankedScores: RecoveryScore[],
  preferredType: 'gym' | 'home' | 'any' = 'any'
): Promise<WorkoutMatch | null> {
  const rows = await getAllWorkouts();

  if (!rows.length) {
    return null;
  }

  const scored = rows.map(row => {
    let muscles: MuscleGroup[] = [];
    try {
      muscles = JSON.parse(row.muscle_groups || '[]') as MuscleGroup[];
    } catch {}

    if (muscles.length === 0) {
      muscles = ['chest', 'back', 'legs', 'shoulders', 'arms'];
    }

    const relevantScores = rankedScores.filter(s => muscles.includes(s.muscle));
    const avgRecovery = relevantScores.length
      ? relevantScores.reduce((sum, s) => sum + s.recoveryPercent, 0) / relevantScores.length
      : 50;

    const typeBonus =
      preferredType === 'any' ? 0 :
      row.type === preferredType ? 15 : -20;

    return {
      id: row.id,
      name: row.name,
      type: (row.type || 'gym') as 'gym' | 'home' | 'rest',
      muscleGroups: muscles,
      estimatedDuration: row.estimated_duration || 45,
      matchScore: Math.min(100, Math.round(avgRecovery + typeBonus)),
      matchReason: buildReason(muscles, relevantScores),
    };
  });

  const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);
  return sorted[0] ?? null;
}

function buildReason(muscles: MuscleGroup[], scores: RecoveryScore[]): string {
  if (!scores.length) return 'Good general session';
  const topMuscle = scores.sort((a, b) => b.recoveryPercent - a.recoveryPercent)[0];
  const days = topMuscle.lastTrainedDaysAgo;
  if (days >= 999) return `${topMuscle.muscle} hasn't been trained yet`;
  return `${topMuscle.muscle} had ${days} day${days !== 1 ? 's' : ''} of rest — optimal timing`;
}