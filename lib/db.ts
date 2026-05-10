import * as SQLite from 'expo-sqlite';

const DB_NAME = 'forgefit.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      exercises TEXT NOT NULL,
      muscle_groups TEXT DEFAULT '[]',
      estimated_duration INTEGER DEFAULT 45,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      workout_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );

    CREATE TABLE IF NOT EXISTS session_sets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      max_weight REAL NOT NULL,
      max_reps INTEGER NOT NULL,
      date TEXT NOT NULL
    );
  `);

  // Add muscle_groups column if it doesn't exist (for existing databases)
  try {
    await db.execAsync(`ALTER TABLE workouts ADD COLUMN muscle_groups TEXT DEFAULT '[]'`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE workouts ADD COLUMN estimated_duration INTEGER DEFAULT 45`);
  } catch {}

  return db;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export async function createSession(
  sessionId: string,
  workoutId: string,
  workoutName: string
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO sessions (id, workout_id, workout_name, started_at, status) VALUES (?, ?, ?, ?, 'active')`,
    [sessionId, workoutId, workoutName, new Date().toISOString()]
  );
}

export async function completeSession(
  sessionId: string,
  notes?: string
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE sessions SET finished_at = ?, notes = ?, status = 'completed' WHERE id = ?`,
    [new Date().toISOString(), notes || null, sessionId]
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
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO session_sets (id, session_id, exercise_id, set_number, reps, weight, completed) VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [setId, sessionId, exerciseId, setNumber, reps, weight]
  );
}

export async function completeSessionSet(setId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE session_sets SET completed = 1 WHERE id = ?`,
    [setId]
  );
}

export async function addPersonalRecord(
  id: string,
  exerciseId: string,
  exerciseName: string,
  maxWeight: number,
  maxReps: number
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO personal_records (id, exercise_id, exercise_name, max_weight, max_reps, date) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, exerciseId, exerciseName, maxWeight, maxReps, new Date().toISOString()]
  );
}

export async function getAllSessions(): Promise<any[]> {
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
}

export async function getSessionSets(sessionId: string): Promise<any[]> {
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
}

export async function getPersonalRecords(): Promise<any[]> {
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
}

export async function getLastSessionForExercise(exerciseId: string): Promise<any | null> {
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
}

export async function getPreviousSessionData(exerciseId: string): Promise<{ weight: number; reps: number } | null> {
  const lastSet = await getLastSessionForExercise(exerciseId);
  if (lastSet) {
    return { weight: lastSet.weight, reps: lastSet.reps };
  }
  return null;
}