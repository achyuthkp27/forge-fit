export type MuscleGroup =
  | 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'glutes' | 'cardio';

export interface MuscleLoad {
  muscle: MuscleGroup;
  volume: number;
  trainedAt: string;
}

export interface RecoveryScore {
  muscle: MuscleGroup;
  lastTrainedDaysAgo: number;
  recoveryPercent: number;
  weeklyVolume: number;
  readiness: 'ready' | 'recovering' | 'fresh';
}

const RECOVERY_HOURS: Record<MuscleGroup, number> = {
  legs: 72,
  back: 60,
  chest: 52,
  glutes: 60,
  shoulders: 48,
  arms: 36,
  core: 24,
  cardio: 20,
};

export function computeRecoveryScores(
  muscleLoads: MuscleLoad[],
  now = new Date()
): RecoveryScore[] {
  const muscles = Object.keys(RECOVERY_HOURS) as MuscleGroup[];

  return muscles.map(muscle => {
    const loads = muscleLoads
      .filter(l => l.muscle === muscle)
      .sort((a, b) => Date.parse(b.trainedAt) - Date.parse(a.trainedAt));

    if (loads.length === 0) {
      return {
        muscle,
        lastTrainedDaysAgo: 999,
        recoveryPercent: 100,
        weeklyVolume: 0,
        readiness: 'fresh',
      };
    }

    const lastLoad = loads[0];
    const hoursAgo = (now.getTime() - Date.parse(lastLoad.trainedAt)) / 3_600_000;
    const requiredHours = RECOVERY_HOURS[muscle];
    const recoveryPercent = Math.min(100, Math.round((hoursAgo / requiredHours) * 100));

    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const weeklyVolume = loads
      .filter(l => Date.parse(l.trainedAt) > sevenDaysAgo.getTime())
      .reduce((sum, l) => sum + l.volume, 0);

    const lastTrainedDaysAgo = Math.round(hoursAgo / 24);

    return {
      muscle,
      lastTrainedDaysAgo,
      recoveryPercent,
      weeklyVolume,
      readiness:
        recoveryPercent >= 90 ? 'ready' :
        recoveryPercent >= 50 ? 'recovering' :
        'fresh',
    };
  });
}

export function rankMusclesForToday(scores: RecoveryScore[]): RecoveryScore[] {
  return [...scores].sort((a, b) => {
    if (b.recoveryPercent !== a.recoveryPercent)
      return b.recoveryPercent - a.recoveryPercent;
    return a.weeklyVolume - b.weeklyVolume;
  });
}