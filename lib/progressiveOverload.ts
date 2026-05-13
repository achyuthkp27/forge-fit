// Progressive Overload Calculator

// Calculate 1RM using Epley formula
export function predict1RM(weight: number, reps: number): number {
  if (reps === 0 || weight === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Calculate next workout targets based on progressive overload
export function calculateNextTargets(
  lastWeight: number,
  lastReps: number,
  targetReps: number,
  progressionRate: number = 0.025 // 2.5% increase
): { weight: number; reps: number; isPR: boolean; reason: string } {
  if (lastWeight === 0 || lastReps === 0) {
    return { weight: 0, reps: targetReps, isPR: false, reason: 'No previous data' };
  }

  const estimated1RM = predict1RM(lastWeight, lastReps);
  // Work at 80-85% of 1RM for hypertrophy
  const targetWeight = Math.round((estimated1RM * 0.82) / 2.5) * 2.5;
  const isPR = targetWeight > lastWeight;

  let reason = '';
  if (isPR) {
    reason = `New PR target! +${Math.round(targetWeight - lastWeight)}kg`;
  } else if (targetWeight === lastWeight) {
    reason = 'Maintain current weight';
  } else {
    reason = `Increase by ${Math.round(targetWeight - lastWeight)}kg`;
  }

  return { weight: targetWeight, reps: targetReps, isPR, reason };
}

// Calculate volume (sets x reps x weight)
export function calculateVolume(sets: number, reps: number, weight: number): number {
  return sets * reps * weight;
}

// Suggest deload when needed
export function suggestDeload(
  weeklyVolume: number[],
  fatigueScore: number = 5,
  sessionFrequency: number = 0
): { shouldDeload: boolean; reason: string; suggestion: string } {
  // If volume dropped 2 weeks in a row
  if (weeklyVolume.length >= 2) {
    const thisWeek = weeklyVolume[weeklyVolume.length - 1];
    const lastWeek = weeklyVolume[weeklyVolume.length - 2];
    if (thisWeek < lastWeek * 0.8) {
      return {
        shouldDeload: true,
        reason: 'Volume dropped significantly',
        suggestion: 'Reduce weight by 10%, keep reps same'
      };
    }
  }

  // High fatigue
  if (fatigueScore > 7) {
    return {
      shouldDeload: true,
      reason: 'High fatigue detected',
      suggestion: 'Take a deload week, 50% volume'
    };
  }

  // Overtraining (too many sessions per week)
  if (sessionFrequency > 6) {
    return {
      shouldDeload: true,
      reason: 'High training frequency',
      suggestion: 'Consider adding rest days'
    };
  }

  return { shouldDeload: false, reason: '', suggestion: '' };
}

// Calculate rest time recommendation based on goals
export function getRecommendedRestTime(
  goal: 'strength' | 'hypertrophy' | 'endurance' = 'hypertrophy'
): { min: number; max: number; description: string } {
  switch (goal) {
    case 'strength':
      return { min: 180, max: 300, description: '3-5 minutes for strength' };
    case 'hypertrophy':
      return { min: 60, max: 120, description: '1-2 minutes for hypertrophy' };
    case 'endurance':
      return { min: 30, max: 60, description: '30s-1min for endurance' };
    default:
      return { min: 60, max: 120, description: '1-2 minutes' };
  }
}

// Calculate weekly volume trend
export function getVolumeTrend(weeklyVolumes: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (weeklyVolumes.length < 2) return 'stable';
  const recent = weeklyVolumes.slice(-2);
  const change = ((recent[1] - recent[0]) / recent[0]) * 100;
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
}
const FORM_TIPS = [
  "Keep your core engaged throughout the movement",
  "Control the eccentric (lowering) phase",
  "Breathe out during the hardest part of the lift",
  "Keep shoulders back and down, not rounded forward",
  "Full range of motion is more important than heavy weight",
  "Focus on mind-muscle connection, not just moving weight",
  "Keep a neutral spine position",
  "Drive through your heels for lower body exercises",
  "Lock out fully at the top of each rep",
  "Keep the bar path as straight as possible",
];

export function getRandomFormTip(exerciseName?: string): string {
  const tip = FORM_TIPS[Math.floor(Math.random() * FORM_TIPS.length)];
  return exerciseName ? `${tip} (${exerciseName})` : tip;
}
