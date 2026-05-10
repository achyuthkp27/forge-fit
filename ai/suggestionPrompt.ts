import type { WorkoutMatch } from './workoutMatcher';
import type { RecoveryScore } from './recoveryEngine';

export interface SuggestionContext {
  topMatch: WorkoutMatch;
  recoveryScores: RecoveryScore[];
  recentSessions: string[];
  streakDays: number;
}

export function buildSuggestionPrompt(data: SuggestionContext): string {
  const topScores = data.recoveryScores
    .filter(s => s.readiness === 'ready' || s.readiness === 'fresh')
    .slice(0, 3)
    .map(s => `${s.muscle}: ${s.recoveryPercent}% recovered`)
    .join(', ');

  const recovering = data.recoveryScores
    .filter(s => s.readiness === 'recovering')
    .map(s => s.muscle)
    .join(', ');

  return `
You are a concise fitness coach AI. Write a 2-sentence motivating explanation
for why the user should do this workout today. Be specific, use the data below.
Do not use bullet points. Do not start with "I". Keep it under 40 words.

Recommended workout: ${data.topMatch.name}
Targets: ${data.topMatch.muscleGroups.join(', ')}
Recovery data: ${topScores}
Still recovering: ${recovering || 'none'}
Recent sessions: ${data.recentSessions.join(' → ')}
Current streak: ${data.streakDays} days

Explanation:`.trim();
}

export function generateFallbackExplanation(data: SuggestionContext): string {
  const topRecovered = data.recoveryScores
    .filter(s => s.readiness === 'ready')
    .sort((a, b) => b.recoveryPercent - a.recoveryPercent)[0];

  if (!topRecovered) {
    return "Let's get moving! This workout is a great way to start your training.";
  }

  const muscleName = topRecovered.muscle.charAt(0).toUpperCase() + topRecovered.muscle.slice(1);
  const days = topRecovered.lastTrainedDaysAgo;

  if (days >= 999) {
    return `${muscleName} hasn't been trained yet — perfect time to give it some attention!`;
  }

  return `${muscleName} has had ${days} days of rest and is fully recovered — great timing for this workout!`;
}