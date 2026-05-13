import * as SQLite from 'expo-sqlite';

const DB_NAME = 'forgefit.db';

let db: SQLite.SQLiteDatabase | null = null;

// Database version for migrations
const DB_VERSION = 4; // Incremented for body_measurements and sleep_history

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      exercises TEXT NOT NULL,
      muscle_groups TEXT DEFAULT '[]',
      estimated_duration INTEGER DEFAULT 45,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      is_favorite INTEGER DEFAULT 0,
      times_completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      workout_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      duration_minutes INTEGER,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );

    CREATE TABLE IF NOT EXISTS session_sets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      completed INTEGER DEFAULT 0,
      rpe REAL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      max_weight REAL NOT NULL,
      max_reps INTEGER NOT NULL,
      date TEXT NOT NULL,
      previous_weight REAL,
      previous_reps INTEGER
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_groups TEXT NOT NULL,
      equipment TEXT NOT NULL,
      difficulty TEXT DEFAULT 'intermediate',
      default_sets INTEGER DEFAULT 3,
      default_reps INTEGER DEFAULT 10,
      coaching_cues TEXT DEFAULT '[]',
      is_custom INTEGER DEFAULT 1,
      demo_url TEXT,
      demo_type TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      weight REAL,
      chest REAL,
      waist REAL,
      hips REAL,
      biceps REAL,
      thighs REAL
    );

    CREATE TABLE IF NOT EXISTS sleep_history (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      energy INTEGER NOT NULL
    );
  `);

  // Run migrations
  await runMigrations(db);

  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const result = await database.getFirstAsync<{ version: number }>('SELECT version FROM db_version LIMIT 1');
  const currentVersion = result?.version || 0;

  if (currentVersion < 1) {
    // Migration from 0 to 1: Add premium columns
    try {
      await database.execAsync(`ALTER TABLE workouts ADD COLUMN is_favorite INTEGER DEFAULT 0`);
      await database.execAsync(`ALTER TABLE workouts ADD COLUMN times_completed INTEGER DEFAULT 0`);
      await database.execAsync(`ALTER TABLE sessions ADD COLUMN duration_minutes INTEGER`);
      await database.execAsync(`ALTER TABLE session_sets ADD COLUMN rpe REAL`);
    } catch (error) {
      console.warn('Migration 0->1 warning (might be expected):', error);
    }
  }

  if (currentVersion < 2) {
    // Migration from 1 to 2: Add exercises table tracking
    try {
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_groups)`);
    } catch (error) {
      console.warn('Migration 1->2 warning (might be expected):', error);
    }
  }

  if (currentVersion < 3) {
    // Migration from 2 to 3: Add performance indexes
    try {
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_sessions_workout ON sessions(workout_id)`);
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at)`);
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_session_sets_session ON session_sets(session_id)`);
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_session_sets_exercise ON session_sets(exercise_id)`);
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id)`);
      await database.execAsync(`CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises(muscle_groups)`);
    } catch (error) {
      console.warn('Migration 2->3 warning (might be expected):', error);
    }
  }

  if (currentVersion < 4) {
    // Migration from 3 to 4: Normalize body measurements and sleep history
    try {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS body_measurements (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          weight REAL,
          chest REAL,
          waist REAL,
          hips REAL,
          biceps REAL,
          thighs REAL
        );
        CREATE TABLE IF NOT EXISTS sleep_history (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          hours REAL NOT NULL,
          energy INTEGER NOT NULL
        );
      `);
      // Optional: Migrate existing JSON blob data to tables here if needed.
    } catch (error) {
      console.warn('Migration 3->4 warning (might be expected):', error);
    }
  }

  if (currentVersion < DB_VERSION) {
    await database.runAsync('INSERT OR REPLACE INTO db_version (version) VALUES (?)', [DB_VERSION]);
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// Helper function for consistent error handling
async function handleDatabaseOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database error in ${operationName}:`, error);
    throw new Error(`Failed to ${operationName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function createSession(
  sessionId: string,
  workoutId: string,
  workoutName: string
): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `INSERT INTO sessions (id, workout_id, workout_name, started_at, status) VALUES (?, ?, ?, ?, 'active')`,
        [sessionId, workoutId, workoutName, new Date().toISOString()]
      );
    },
    'create session'
  );
}

export async function completeSession(
  sessionId: string,
  notes?: string
): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `UPDATE sessions SET finished_at = ?, notes = ?, status = 'completed' WHERE id = ?`,
        [new Date().toISOString(), notes || null, sessionId]
      );
    },
    'complete session'
  );
}

export async function logSessionSet(
  setId: string,
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  reps: number,
  weight: number
): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `INSERT INTO session_sets (id, session_id, exercise_id, set_number, reps, weight, completed) VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [setId, sessionId, exerciseId, setNumber, reps, weight]
      );
    },
    'log session set'
  );
}

export async function completeSessionSet(setId: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `UPDATE session_sets SET completed = 1 WHERE id = ?`,
        [setId]
      );
    },
    'complete session set'
  );
}

export async function addPersonalRecord(
  id: string,
  exerciseId: string,
  exerciseName: string,
  maxWeight: number,
  maxReps: number
): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `INSERT INTO personal_records (id, exercise_id, exercise_name, max_weight, max_reps, date) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, exerciseId, exerciseName, maxWeight, maxReps, new Date().toISOString()]
      );
    },
    'add personal record'
  );
}

export async function getAllSessions(): Promise<any[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const sessions = await database.getAllAsync<{
        id: string;
        workout_id: string;
        workout_name: string;
        started_at: string;
        finished_at: string | null;
        notes: string | null;
        status: string;
      }>(`SELECT * FROM sessions WHERE status = 'completed' ORDER BY started_at DESC`);
      return sessions;
    },
    'get all sessions'
  );
}

export async function deleteSession(sessionId: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync('DELETE FROM session_sets WHERE session_id = ?', [sessionId]);
      await database.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
    },
    'delete session'
  );
}

export async function getSessionSets(sessionId: string): Promise<any[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const sets = await database.getAllAsync<{
        id: string;
        session_id: string;
        exercise_id: string;
        set_number: number;
        reps: number;
        weight: number;
        completed: number;
      }>(`SELECT * FROM session_sets WHERE session_id = ? ORDER BY set_number`, [sessionId]);
      return sets;
    },
    'get session sets'
  );
}

export async function getPersonalRecords(): Promise<any[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const prs = await database.getAllAsync<{
        id: string;
        exercise_id: string;
        exercise_name: string;
        max_weight: number;
        max_reps: number;
        date: string;
      }>(`SELECT * FROM personal_records ORDER BY date DESC`);
      return prs;
    },
    'get personal records'
  );
}

export async function getLastSessionForExercise(exerciseId: string): Promise<any | null> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const result = await database.getFirstAsync<{
        id: string;
        session_id: string;
        exercise_id: string;
        set_number: number;
        reps: number;
        weight: number;
      }>(`
        SELECT ss.* FROM session_sets ss
        JOIN sessions s ON ss.session_id = s.id
        WHERE ss.exercise_id = ? AND s.status = 'completed'
        ORDER BY s.started_at DESC, ss.set_number DESC
        LIMIT 1
      `, [exerciseId]);
      return result || null;
    },
    'get last session for exercise'
  );
}

export async function getPreviousSessionData(exerciseId: string): Promise<{ weight: number; reps: number } | null> {
  return handleDatabaseOperation(
    async () => {
      const lastSet = await getLastSessionForExercise(exerciseId);
      if (lastSet) {
        return { weight: lastSet.weight, reps: lastSet.reps };
      }
      return null;
    },
    'get previous session data'
  );
}

// ==================== WORKOUT CRUD ====================

export interface WorkoutRow {
  id: string;
  name: string;
  type: string;
  exercises: string;
  muscle_groups: string;
  estimated_duration: number;
  created_at: string;
  updated_at: string | null;
  is_favorite: number;
  times_completed: number;
}

export interface WorkoutExerciseRow {
  exerciseId: string;
  sets: number;
  reps: number;
  order?: number;
  format?: string;
  emomMinutes?: number;
  circuitRounds?: number;
  supersetGroup?: number;
}

export async function createWorkout(
  id: string,
  name: string,
  type: string,
  exercises: WorkoutExerciseRow[],
  muscleGroups: string[],
  estimatedDuration: number = 45
): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `INSERT INTO workouts (id, name, type, exercises, muscle_groups, estimated_duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, type, JSON.stringify(exercises), JSON.stringify(muscleGroups), estimatedDuration, new Date().toISOString()]
      );
    },
    'create workout'
  );
}

export async function updateWorkout(
  id: string,
  name: string,
  type: string,
  exercises: WorkoutExerciseRow[],
  muscleGroups: string[],
  estimatedDuration: number
): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `UPDATE workouts SET name = ?, type = ?, exercises = ?, muscle_groups = ?, estimated_duration = ?, updated_at = ? WHERE id = ?`,
        [name, type, JSON.stringify(exercises), JSON.stringify(muscleGroups), estimatedDuration, new Date().toISOString(), id]
      );
    },
    'update workout'
  );
}

export async function deleteWorkout(id: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
    },
    'delete workout'
  );
}

export async function getAllWorkouts(): Promise<WorkoutRow[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getAllAsync<WorkoutRow>('SELECT * FROM workouts ORDER BY created_at DESC');
    },
    'get all workouts'
  );
}

export async function getWorkout(id: string): Promise<WorkoutRow | null> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getFirstAsync<WorkoutRow>('SELECT * FROM workouts WHERE id = ?', [id]);
    },
    'get workout'
  );
}

export async function toggleWorkoutFavorite(id: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        'UPDATE workouts SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?',
        [id]
      );
    },
    'toggle workout favorite'
  );
}

export async function incrementWorkoutCompletion(id: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync('UPDATE workouts SET times_completed = times_completed + 1 WHERE id = ?', [id]);
    },
    'increment workout completion'
  );
}

export async function duplicateWorkout(id: string, newId: string, newName: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const workout = await getWorkout(id);
      if (!workout) return;
      
      const database = await getDb();
      await database.runAsync(
        `INSERT INTO workouts (id, name, type, exercises, muscle_groups, estimated_duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newId, newName, workout.type, workout.exercises, workout.muscle_groups, workout.estimated_duration, new Date().toISOString()]
      );
    },
    'duplicate workout'
  );
}

// ==================== EXERCISE CRUD ====================

export interface ExerciseRow {
  id: string;
  name: string;
  muscle_groups: string;
  equipment: string;
  difficulty: string;
  default_sets: number;
  default_reps: number;
  coaching_cues: string;
  is_custom: number;
  demo_url: string | null;
  demo_type: string | null;
  created_at: string;
}

export async function createExercise(
  id: string,
  name: string,
  muscleGroups: string[],
  equipment: string,
  difficulty: string = 'intermediate',
  defaultSets: number = 3,
  defaultReps: number = 10,
  coachingCues: string[] = [],
  demoUrl?: string,
  demoType?: string
): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync(
        `INSERT INTO exercises (id, name, muscle_groups, equipment, difficulty, default_sets, default_reps, coaching_cues, is_custom, demo_url, demo_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [id, name, JSON.stringify(muscleGroups), equipment, difficulty, defaultSets, defaultReps, JSON.stringify(coachingCues), demoUrl || null, demoType || null, new Date().toISOString()]
      );
    },
    'create exercise'
  );
}

export async function getAllExercises(): Promise<ExerciseRow[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getAllAsync<ExerciseRow>('SELECT * FROM exercises ORDER BY is_custom DESC, name ASC');
    },
    'get all exercises'
  );
}

export async function getCustomExercises(): Promise<ExerciseRow[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getAllAsync<ExerciseRow>('SELECT * FROM exercises WHERE is_custom = 1 ORDER BY created_at DESC');
    },
    'get custom exercises'
  );
}

export async function getExercise(id: string): Promise<ExerciseRow | null> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getFirstAsync<ExerciseRow>('SELECT * FROM exercises WHERE id = ?', [id]);
    },
    'get exercise'
  );
}

export async function searchExercisesDB(query: string, muscleGroup?: string): Promise<ExerciseRow[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      let sql = 'SELECT * FROM exercises WHERE name LIKE ?';
      const params: string[] = [`%${query}%`];

      if (muscleGroup) {
        sql += ' AND muscle_groups LIKE ?';
        params.push(`%${muscleGroup}%`);
      }

      return await database.getAllAsync<ExerciseRow>(sql, params);
    },
    'search exercises'
  );
}

export async function deleteExercise(id: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
    },
    'delete exercise'
  );
}

// ==================== SETTINGS ====================

export async function getSetting(key: string): Promise<string | null> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const result = await database.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
      return result?.value || null;
    },
    'get setting'
  );
}

export async function setSetting(key: string, value: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    },
    'set setting'
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const results = await database.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
      const settings: Record<string, string> = {};
      results.forEach(r => { settings[r.key] = r.value; });
      return settings;
    },
    'get all settings'
  );
}

export async function getSettings(): Promise<Record<string, string>> {
  return getAllSettings();
}

export async function saveSetting(key: string, value: string): Promise<void> {
  return setSetting(key, value);
}

export async function clearAllWorkoutData(): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.execAsync('DELETE FROM session_sets');
      await database.execAsync('DELETE FROM sessions');
      await database.execAsync('DELETE FROM personal_records');
      await database.execAsync("DELETE FROM settings WHERE key = 'badges'");
    },
    'clear all workout data'
  );
}

export async function clearAllData(): Promise<void> {
  return clearAllWorkoutData();
}


// ==================== BADGES ====================

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'streak' | 'sessions' | 'prs' | 'consistency';
  unlockedAt?: string;
}

// Default badges
export const DEFAULT_BADGES: BadgeData[] = [
  { id: 'first_workout', name: 'First Steps', description: 'Complete your first workout', icon: 'play', requirement: 1, type: 'sessions' },
  { id: 'workout_10', name: 'Getting Started', description: 'Complete 10 workouts', icon: 'trophy', requirement: 10, type: 'sessions' },
  { id: 'workout_50', name: 'Half Century', description: 'Complete 50 workouts', icon: 'flame', requirement: 50, type: 'sessions' },
  { id: 'workout_100', name: 'Centurion', description: 'Complete 100 workouts', icon: 'star', requirement: 100, type: 'sessions' },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day workout streak', icon: 'calendar', requirement: 7, type: 'streak' },
  { id: 'streak_30', name: 'Monthly Master', description: '30-day workout streak', icon: 'flame', requirement: 30, type: 'streak' },
  { id: 'first_pr', name: 'PR Hunter', description: 'Set your first personal record', icon: 'trophy', requirement: 1, type: 'prs' },
  { id: 'prs_5_week', name: 'PR Machine', description: '5 PRs in one week', icon: 'zap', requirement: 5, type: 'prs' },
  { id: 'consistency_4', name: 'Pattern Master', description: 'Work out on same day 4 weeks in a row', icon: 'calendar', requirement: 4, type: 'consistency' },
];

export async function getAllBadges(): Promise<BadgeData[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const stored = await getSetting('badges');
      const unlocked: Record<string, string> = stored ? JSON.parse(stored) : {};

      return DEFAULT_BADGES.map(badge => ({
        ...badge,
        unlockedAt: unlocked[badge.id],
      }));
    },
    'get all badges'
  );
}

export async function unlockBadge(badgeId: string): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const stored = await getSetting('badges');
      const unlocked: Record<string, string> = stored ? JSON.parse(stored) : {};

      if (!unlocked[badgeId]) {
        unlocked[badgeId] = new Date().toISOString();
        await setSetting('badges', JSON.stringify(unlocked));
      }
    },
    'unlock badge'
  );
}

export async function checkAndUnlockBadges(
  totalSessions: number,
  currentStreak: number,
  totalPRs: number,
  prsThisWeek: number,
  consistencyWeeks: number
): Promise<BadgeData[]> {
  return handleDatabaseOperation(
    async () => {
      const newlyUnlocked: BadgeData[] = [];

      // Check session badges
      if (totalSessions >= 1) await tryUnlock('first_workout', newlyUnlocked);
      if (totalSessions >= 10) await tryUnlock('workout_10', newlyUnlocked);
      if (totalSessions >= 50) await tryUnlock('workout_50', newlyUnlocked);
      if (totalSessions >= 100) await tryUnlock('workout_100', newlyUnlocked);

      // Check streak badges
      if (currentStreak >= 7) await tryUnlock('streak_7', newlyUnlocked);
      if (currentStreak >= 30) await tryUnlock('streak_30', newlyUnlocked);

      // Check PR badges
      if (totalPRs >= 1) await tryUnlock('first_pr', newlyUnlocked);
      if (prsThisWeek >= 5) await tryUnlock('prs_5_week', newlyUnlocked);

      // Check consistency
      if (consistencyWeeks >= 4) await tryUnlock('consistency_4', newlyUnlocked);

      return newlyUnlocked;
    },
    'check and unlock badges'
  );
}

async function tryUnlock(badgeId: string, newlyUnlocked: BadgeData[]): Promise<void> {
  const badge = DEFAULT_BADGES.find(b => b.id === badgeId);
  if (badge) {
    await unlockBadge(badgeId);
    newlyUnlocked.push({ ...badge, unlockedAt: new Date().toISOString() });
  }
}

// ==================== WEEKLY SCHEDULE ====================

export interface WeeklyScheduleItem {
  dayIndex: number;
  workoutId: string | null;
  isCompleted: boolean;
}

export async function getWeeklySchedule(): Promise<WeeklyScheduleItem[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const result = await database.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM settings WHERE key LIKE "schedule_%"'
      );
      const schedule: WeeklyScheduleItem[] = [];
      for (let i = 0; i < 7; i++) {
        const saved = result.find(r => r.key === `schedule_${i}`);
        if (saved) {
          schedule[i] = JSON.parse(saved.value);
        } else {
          schedule[i] = { dayIndex: i, workoutId: null, isCompleted: false };
        }
      }
      return schedule;
    },
    'get weekly schedule'
  );
}

export async function saveWeeklyScheduleItem(dayIndex: number, item: WeeklyScheduleItem): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      await setSetting(`schedule_${dayIndex}`, JSON.stringify(item));
    },
    'save weekly schedule item'
  );
}

export async function clearWeeklySchedule(): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      await database.execAsync("DELETE FROM settings WHERE key LIKE 'schedule_%'");
    },
    'clear weekly schedule'
  );
}

// ==================== BODY MEASUREMENTS ====================

export interface BodyMeasurements {
  id: string;
  date: string;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  arms?: number;
  thighs?: number;
  updatedAt?: string;
}

export async function getBodyMeasurements(): Promise<BodyMeasurements | null> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const result = await database.getFirstAsync<BodyMeasurements>(
        'SELECT * FROM body_measurements ORDER BY date DESC LIMIT 1'
      );
      return result || null;
    },
    'get body measurements'
  );
}

export async function saveBodyMeasurements(measurements: BodyMeasurements): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const id = Date.now().toString();
      const date = measurements.updatedAt || new Date().toISOString();
      await database.runAsync(
        'INSERT INTO body_measurements (id, date, chest, waist, hips, biceps, thighs) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, date, measurements.chest || null, measurements.waist || null, measurements.hips || null, measurements.biceps || null, measurements.thighs || null]
      );
    },
    'save body measurements'
  );
}

// ==================== SLEEP HISTORY ====================

export interface SleepEntry {
  date: string;
  hours: number;
  energy: number;
}

export async function getSleepHistory(): Promise<SleepEntry[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getAllAsync<SleepEntry>('SELECT date, hours, energy FROM sleep_history ORDER BY date ASC');
    },
    'get sleep history'
  );
}

export async function saveSleepHistory(history: SleepEntry[]): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      // To sync properly, we will clear the table and insert the new history 
      // (or you can loop and upsert based on date)
      await database.execAsync('DELETE FROM sleep_history');
      for (const entry of history) {
        await database.runAsync(
          'INSERT INTO sleep_history (id, date, hours, energy) VALUES (?, ?, ?, ?)',
          [Date.now().toString() + Math.random(), entry.date, entry.hours, entry.energy]
        );
      }
    },
    'save sleep history'
  );
}

// ==================== BATCH OPERATIONS ====================

export async function getWorkoutStats(): Promise<{
  totalWorkouts: number;
  favoriteWorkouts: number;
  totalSessions: number;
  totalVolume: number;
}> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();

      const workoutsResult = await database.getFirstAsync<{ count: number; favorites: number }>(
        'SELECT COUNT(*) as count, SUM(is_favorite) as favorites FROM workouts'
      );

      const sessionsResult = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'"
      );

      const volumeResult = await database.getFirstAsync<{ total: number }>(
        'SELECT SUM(reps * weight) as total FROM session_sets'
      );

      return {
        totalWorkouts: workoutsResult?.count || 0,
        favoriteWorkouts: workoutsResult?.favorites || 0,
        totalSessions: sessionsResult?.count || 0,
        totalVolume: volumeResult?.total || 0,
      };
    },
    'get workout stats'
  );
}

export async function getRecentWorkouts(limit: number = 5): Promise<WorkoutRow[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getAllAsync<WorkoutRow>(
        'SELECT * FROM workouts ORDER BY updated_at DESC, created_at DESC LIMIT ?',
        [limit]
      );
    },
    'get recent workouts'
  );
}

// ==================== SEED DATA ====================

export async function seedInitialData(): Promise<void> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const existingWorkouts = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM workouts');

      if (existingWorkouts && existingWorkouts.count > 0) {
        return; // Data already exists
      }

      // Seed sample workouts (similar to mock data)
      const sampleWorkouts = [
        {
          id: 'sample-push-day',
          name: 'Push Day',
          type: 'gym',
          exercises: [
            { exerciseId: 'ex-1', sets: 4, reps: 10, order: 0 },
            { exerciseId: 'ex-2', sets: 3, reps: 12, order: 1 },
            { exerciseId: 'ex-3', sets: 3, reps: 10, order: 2 },
            { exerciseId: 'ex-5', sets: 3, reps: 12, order: 3 },
            { exerciseId: 'ex-6', sets: 3, reps: 15, order: 4 },
          ],
          muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
          estimatedDuration: 50,
        },
        {
          id: 'sample-pull-day',
          name: 'Pull Day',
          type: 'gym',
          exercises: [
            { exerciseId: 'ex-7', sets: 4, reps: 8, order: 0 },
            { exerciseId: 'ex-8', sets: 3, reps: 10, order: 1 },
            { exerciseId: 'ex-9', sets: 3, reps: 12, order: 2 },
            { exerciseId: 'ex-10', sets: 3, reps: 15, order: 3 },
            { exerciseId: 'ex-11', sets: 3, reps: 12, order: 4 },
          ],
          muscleGroups: ['Back', 'Biceps'],
          estimatedDuration: 45,
        },
        {
          id: 'sample-leg-day',
          name: 'Leg Day',
          type: 'gym',
          exercises: [
            { exerciseId: 'ex-12', sets: 4, reps: 8, order: 0 },
            { exerciseId: 'ex-13', sets: 3, reps: 10, order: 1 },
            { exerciseId: 'ex-14', sets: 3, reps: 12, order: 2 },
            { exerciseId: 'ex-15', sets: 3, reps: 15, order: 3 },
            { exerciseId: 'ex-16', sets: 3, reps: 12, order: 4 },
          ],
          muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes'],
          estimatedDuration: 55,
        },
        {
          id: 'sample-home-fullbody',
          name: 'Home Full Body',
          type: 'home',
           exercises: [
             { exerciseId: 'ex-18', sets: 3, reps: 15, order: 0 },
             { exerciseId: 'ex-19', sets: 3, reps: 12, order: 1 },
             { exerciseId: 'ex-21', sets: 3, reps: 12, order: 2 },
             { exerciseId: 'ex-23', sets: 3, reps: 15, order: 3 },
             { exerciseId: 'ex-24', sets: 3, reps: 20, order: 4 }
           ],
          muscleGroups: ['Full Body'],
          estimatedDuration: 30,
        },
      ];

      const now = new Date().toISOString();
      for (const workout of sampleWorkouts) {
        await database.runAsync(
          `INSERT INTO workouts (id, name, type, exercises, muscle_groups, estimated_duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [workout.id, workout.name, workout.type, JSON.stringify(workout.exercises), JSON.stringify(workout.muscleGroups), workout.estimatedDuration, now]
        );
      }

      // Seed sample PRs
      const samplePRs = [
        { id: 'pr-1', exerciseId: 'ex-1', exerciseName: 'Barbell Bench Press', maxWeight: 100, maxReps: 5 },
        { id: 'pr-2', exerciseId: 'ex-12', exerciseName: 'Barbell Back Squat', maxWeight: 140, maxReps: 5 },
        { id: 'pr-3', exerciseId: 'ex-7', exerciseName: 'Deadlift', maxWeight: 140, maxReps: 3 },
      ];

      for (const pr of samplePRs) {
        await database.runAsync(
          `INSERT INTO personal_records (id, exercise_id, exercise_name, max_weight, max_reps, date) VALUES (?, ?, ?, ?, ?, ?)`,
          [pr.id, pr.exerciseId, pr.exerciseName, pr.maxWeight, pr.maxReps, now]
        );
      }
    },
    'seed initial data'
  );
}

// ==================== ANALYTICS ====================

export interface WeeklyVolumeStats {
  week: string;
  volume: number;
  sessions: number;
}

export async function getWeeklyVolumeStats(weeks: number = 8): Promise<WeeklyVolumeStats[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const results = await database.getAllAsync<{ week: string; volume: number; sessions: number }>(`
        SELECT
          strftime('%Y-W%W', started_at) as week,
          SUM(reps * weight) as volume,
          COUNT(DISTINCT s.id) as sessions
        FROM sessions s
        JOIN session_sets ss ON s.id = ss.session_id
        WHERE s.status = 'completed' AND s.started_at > date('now', '-${weeks * 7} days')
        GROUP BY week
        ORDER BY week ASC
      `);
      return results;
    },
    'get weekly volume stats'
  );
}

export interface MuscleGroupStats {
  muscle: string;
  count: number;
}

export async function getMuscleGroupStats(): Promise<MuscleGroupStats[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      // This is a simplified version - in production you'd join with exercises
      const results = await database.getAllAsync<MuscleGroupStats>(`
        SELECT 'Chest' as muscle, COUNT(*) as count FROM session_sets WHERE exercise_id IN ('ex-1', 'ex-2', 'ex-3', 'ex-4')
        UNION ALL SELECT 'Back', COUNT(*) FROM session_sets WHERE exercise_id IN ('ex-7', 'ex-8', 'ex-9', 'ex-10')
        UNION ALL SELECT 'Shoulders', COUNT(*) FROM session_sets WHERE exercise_id IN ('ex-5', 'ex-6', 'ex-11')
        UNION ALL SELECT 'Arms', COUNT(*) FROM session_sets WHERE exercise_id IN ('ex-21', 'ex-22', 'ex-23', 'ex-24')
        UNION ALL SELECT 'Legs', COUNT(*) FROM session_sets WHERE exercise_id IN ('ex-12', 'ex-13', 'ex-14', 'ex-15', 'ex-16', 'ex-17')
        UNION ALL SELECT 'Core', COUNT(*) FROM session_sets WHERE exercise_id IN ('ex-25', 'ex-26')
      `);
      return results;
    },
    'get muscle group stats'
  );
}

export interface SessionHistoryStats {
  totalSessions: number;
  totalVolume: number;
  avgDuration: number;
  totalPRs: number;
}

export async function getSessionHistoryStats(): Promise<SessionHistoryStats> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();

      const sessionsResult = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'"
      );

      const volumeResult = await database.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(reps * weight), 0) as total FROM session_sets ss JOIN sessions s ON ss.session_id = s.id WHERE s.status = ?',
        ['completed']
      );

      const durationResult = await database.getFirstAsync<{ avg: number }>(
        "SELECT AVG((julianday(finished_at) - julianday(started_at)) * 24 * 60) as avg FROM sessions WHERE status = 'completed' AND finished_at IS NOT NULL"
      );

      const prsResult = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM personal_records'
      );

      return {
        totalSessions: sessionsResult?.count || 0,
        totalVolume: volumeResult?.total || 0,
        avgDuration: Math.round(durationResult?.avg || 0),
        totalPRs: prsResult?.count || 0,
      };
    },
    'get session history stats'
  );
}

export async function getRecentPRs(limit: number = 5): Promise<any[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getAllAsync(
        'SELECT * FROM personal_records ORDER BY date DESC LIMIT ?',
        [limit]
      );
    },
    'get recent PRs'
  );
}

export async function getWorkoutStreak(): Promise<number> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      const result = await database.getFirstAsync<{ streak: number }>(`
        WITH RECURSIVE dates AS (
          SELECT date(started_at) as workout_date
          FROM sessions
          WHERE status = 'completed'
          GROUP BY date(started_at)
        ),
        streaks AS (
          SELECT workout_date, 1 as streak,
            julianday(workout_date) - row_number() OVER (ORDER BY workout_date) as grp
          FROM dates
        )
        SELECT MAX(streak) as streak FROM streaks
      `);
      return result?.streak || 0;
    },
    'get workout streak'
  );
}

export async function getExerciseHistory(exerciseId: string, limit: number = 10): Promise<any[]> {
  return handleDatabaseOperation(
    async () => {
      const database = await getDb();
      return await database.getAllAsync(
        `SELECT ss.*, s.started_at as session_date
         FROM session_sets ss
         JOIN sessions s ON ss.session_id = s.id
         WHERE ss.exercise_id = ? AND s.status = 'completed'
         ORDER BY s.started_at DESC
         LIMIT ?`,
        [exerciseId, limit]
      );
    },
    'get exercise history'
  );
}