import { getDb } from './db';
import type { MuscleGroup } from '../ai/recoveryEngine';

export interface MuscleLoad {
  muscle: MuscleGroup;
  volume: number;
  trainedAt: string;
}

interface RawSessionRow {
  finished_at: string;
  muscle_groups: string;
  total_volume: number;
}

export async function getMuscleLoadHistory(daysBack = 14): Promise<MuscleLoad[]> {
  const db = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const rows = await db.getAllAsync<RawSessionRow>(`
    SELECT
      s.finished_at,
      w.muscle_groups,
      COALESCE(SUM(ss.reps * ss.weight * ss.completed), 0) AS total_volume
    FROM sessions s
    JOIN workouts w ON w.id = s.workout_id
    LEFT JOIN session_sets ss ON ss.session_id = s.id
    WHERE s.status = 'completed'
      AND s.finished_at >= ?
    GROUP BY s.id
    ORDER BY s.finished_at DESC
  `, [cutoff.toISOString()]);

  const loads: MuscleLoad[] = [];
  for (const row of rows) {
    let muscles: MuscleGroup[] = [];
    try {
      muscles = JSON.parse(row.muscle_groups || '[]') as MuscleGroup[];
    } catch {
      continue;
    }
    if (muscles.length === 0) {
      muscles = ['chest', 'back', 'legs', 'shoulders', 'arms'];
    }
    const distributedVolume = muscles.length > 0 ? row.total_volume / muscles.length : row.total_volume;
    for (const muscle of muscles) {
      loads.push({
        muscle,
        volume: distributedVolume,
        trainedAt: row.finished_at,
      });
    }
  }
  return loads;
}

export async function getRecentSessionNames(limit = 3): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ name: string; finished_at: string }>(`
    SELECT w.name, s.finished_at
    FROM sessions s
    JOIN workouts w ON w.id = s.workout_id
    WHERE s.status = 'completed'
    ORDER BY s.finished_at DESC
    LIMIT ?
  `, [limit]);
  return rows.map(r => r.name);
}

export async function getTodaySessionCount(): Promise<number> {
  const db = await getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = await db.getAllAsync<{ count: number }>(`
    SELECT COUNT(*) as count FROM sessions
    WHERE status = 'completed'
      AND finished_at >= ?
  `, [today.toISOString()]);
  return rows[0]?.count ?? 0;
}

export async function getAllWorkouts(): Promise<Array<{
  id: string;
  name: string;
  type: string;
  muscle_groups: string;
  estimated_duration: number;
}>> {
  const db = await getDb();
  return db.getAllAsync(`
    SELECT id, name, type, muscle_groups, estimated_duration
    FROM workouts
    ORDER BY name
  `);
}