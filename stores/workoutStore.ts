import { create } from 'zustand';
import { Exercise, Workout, WorkoutSession, SetLog, PersonalRecord, UserSettings, ChatMessage, WorkoutTemplate, BodyMeasurement, SleepRecord, WeeklyScheduleItem } from '../types';
import { mockExercises, mockWorkouts, mockPersonalRecords } from '../data/mockData';
import { createSession, completeSession as dbCompleteSession, logSessionSet, completeSessionSet, addPersonalRecord as dbAddPR, initDatabase, getAllSessions, getSessionSets, getPersonalRecords, getPreviousSessionData, getSettings, saveSetting, clearAllData, getBodyMeasurements, saveBodyMeasurements as dbSaveBodyMeasurements, getSleepHistory, saveSleepHistory as dbSaveSleepHistory } from '../lib/db';

interface WorkoutState {
  exercises: Exercise[];
  searchExercises: (query: string, muscleGroup?: string) => Exercise[];
  addExercise: (exercise: Exercise) => void;
  workouts: Workout[];
  currentWorkout: Workout | null;
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  sessionStartTime: number | null;
  currentExerciseIndex: number;
  startSession: (workout: Workout) => Promise<void>;
  logSet: (exerciseId: string, setNumber: number, reps: number, weight: number) => Promise<void>;
  completeSet: (setId: string) => void;
  endSession: (notes?: string) => Promise<void>;
  addSet: (exerciseId: string, setNumber: number) => void;
  removeSet: (setId: string) => void;
  goToExercise: (index: number) => void;
  nextExercise: () => void;
  prevExercise: () => void;
  personalRecords: PersonalRecord[];
  addPersonalRecord: (exerciseId: string, weight: number, reps: number) => Promise<void>;
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  suggestedWorkout: WorkoutTemplate | null;
  setSuggestedWorkout: (template: WorkoutTemplate | null) => void;
  addWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  duplicateWorkout: (id: string) => void;
  getPreviousExerciseData: (exerciseId: string) => Promise<{ weight: number; reps: number } | null>;
  loadData: () => Promise<void>;
  checkAndUpdatePR: (exerciseId: string, weight: number, reps: number) => boolean;
  getProgressiveOverloadSuggestion: (exerciseId: string) => { exerciseName: string; lastWeight: number; suggestedWeight: number; increase: string } | null;
  bodyMeasurements: BodyMeasurement[];
  loadBodyMeasurements: () => Promise<void>;
  saveBodyMeasurements: (measurement: BodyMeasurement) => Promise<void>;
  sleepHistory: SleepRecord[];
  loadSleepHistory: () => Promise<void>;
  saveSleepHistory: (record: SleepRecord) => Promise<void>;
  weeklySchedule: WeeklyScheduleItem[];
  loadWeeklySchedule: () => Promise<void>;
  updateScheduleItem: (item: WeeklyScheduleItem) => void;
  loadSettings: () => Promise<void>;
  clearHistory: () => Promise<void>;
  isInitialized: boolean;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  exercises: mockExercises,
  searchExercises: (query, muscleGroup) => {
    const { exercises } = get();
    return exercises.filter(ex => {
      const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase());
      const matchesMuscle = !muscleGroup || ex.muscleGroups.includes(muscleGroup);
      return matchesQuery && matchesMuscle;
    });
  },
  addExercise: (exercise: Exercise) => set(state => ({ exercises: [...state.exercises, exercise] })),
  workouts: mockWorkouts,
  currentWorkout: null,
  sessions: [],
  activeSession: null,
  sessionStartTime: null,
  currentExerciseIndex: 0,
  startSession: async (workout) => {
    await initDatabase();
    const sessionId = Date.now().toString();
    await createSession(sessionId, workout.id, workout.name);
    const session: WorkoutSession = {
      id: sessionId,
      workoutId: workout.id,
      workoutName: workout.name,
      startTime: new Date(),
      sets: [],
    };
    set({ activeSession: session, sessionStartTime: Date.now(), currentExerciseIndex: 0, currentWorkout: workout });
  },
  logSet: async (exerciseId, setNumber, reps, weight) => {
    const { activeSession } = get();
    if (!activeSession) return;
    const setId = `${Date.now()}-${setNumber}`;
    await logSessionSet(setId, activeSession.id, exerciseId, setNumber, reps, weight);
    const setLog: SetLog = {
      id: setId,
      sessionId: activeSession.id,
      exerciseId,
      setNumber,
      reps,
      weight,
      completed: false,
    };
    set({ activeSession: { ...activeSession, sets: [...activeSession.sets, setLog] } });
  },
  completeSet: (setId) => {
    const { activeSession } = get();
    if (!activeSession) return;
    set({
      activeSession: {
        ...activeSession,
        sets: activeSession.sets.map(s => s.id === setId ? { ...s, completed: true } : s),
      },
    });
  },
  endSession: async (notes?: string) => {
    const { activeSession, sessions } = get();
    if (!activeSession) return;
    await dbCompleteSession(activeSession.id, notes);
    const completedSession = { ...activeSession, endTime: new Date(), notes };
    set({ sessions: [...sessions, completedSession], activeSession: null, sessionStartTime: null, currentWorkout: null, currentExerciseIndex: 0 });
  },
  addSet: (exerciseId, setNumber) => {
    const { activeSession } = get();
    if (!activeSession) return;
    const setId = `${Date.now()}-${setNumber}`;
    const newSet: SetLog = {
      id: setId,
      sessionId: activeSession.id,
      exerciseId,
      setNumber,
      reps: 0,
      weight: 0,
      completed: false,
    };
    set({ activeSession: { ...activeSession, sets: [...activeSession.sets, newSet] } });
  },
  removeSet: (setId) => {
    const { activeSession } = get();
    if (!activeSession) return;
    set({ activeSession: { ...activeSession, sets: activeSession.sets.filter(s => s.id !== setId) } });
  },
  goToExercise: (index) => {
    set({ currentExerciseIndex: index });
  },
  nextExercise: () => {
    const { currentWorkout, currentExerciseIndex } = get();
    if (!currentWorkout) return;
    if (currentExerciseIndex < currentWorkout.exercises.length - 1) {
      set({ currentExerciseIndex: currentExerciseIndex + 1 });
    }
  },
  prevExercise: () => {
    const { currentExerciseIndex } = get();
    if (currentExerciseIndex > 0) {
      set({ currentExerciseIndex: currentExerciseIndex - 1 });
    }
  },
  personalRecords: mockPersonalRecords,
  addPersonalRecord: async (exerciseId, weight, reps) => {
    const { exercises, personalRecords } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    const prId = Date.now().toString();
    await dbAddPR(prId, exerciseId, exercise.name, weight, reps);
    const pr: PersonalRecord = {
      id: prId,
      exerciseId,
      exerciseName: exercise.name,
      maxWeight: weight,
      maxReps: reps,
      date: new Date(),
    };
    set({ personalRecords: [...personalRecords, pr] });
  },
  settings: { unit: 'kg', theme: 'dark', goals: ['Build muscle'], experienceLevel: 'intermediate' },
  updateSettings: async (newSettings) => {
    const { settings } = get();
    const updated = { ...settings, ...newSettings };
    set({ settings: updated });
    
    try {
      for (const key of Object.keys(newSettings)) {
        const val = newSettings[key as keyof UserSettings];
        const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        await saveSetting(key, stringVal);
      }
    } catch (e) {
      console.log('Error saving settings:', e);
    }
  },
  messages: [],
  addMessage: (message) => set(state => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  suggestedWorkout: null,
  setSuggestedWorkout: (template) => set({ suggestedWorkout: template }),
  addWorkout: (workout: Workout) => set(state => ({ workouts: [...state.workouts, workout] })),
  deleteWorkout: (id: string) => set(state => ({ workouts: state.workouts.filter(w => w.id !== id) })),
  duplicateWorkout: (id: string) => {
    const { workouts } = get();
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;
    const newWorkout = { ...workout, id: Date.now().toString(), name: `${workout.name} (Copy)`, createdAt: new Date() };
    set({ workouts: [...workouts, newWorkout] });
  },
  loadData: async () => {
    try {
      await initDatabase();
      const dbSessions = await getAllSessions();
      const dbPRs = await getPersonalRecords();

      const sessions: WorkoutSession[] = await Promise.all(
        dbSessions.map(async (s) => {
          const sets = await getSessionSets(s.id);
          return {
            id: s.id,
            workoutId: s.workout_id,
            workoutName: s.workout_name,
            startTime: new Date(s.started_at),
            endTime: s.finished_at ? new Date(s.finished_at) : undefined,
            notes: s.notes || undefined,
            sets: sets.map(set => ({
              id: set.id,
              sessionId: set.session_id,
              exerciseId: set.exercise_id,
              setNumber: set.set_number,
              reps: set.reps,
              weight: set.weight,
              completed: set.completed === 1,
            })),
          };
        })
      );

      const personalRecords: PersonalRecord[] = dbPRs.map(pr => ({
        id: pr.id,
        exerciseId: pr.exercise_id,
        exerciseName: pr.exercise_name,
        maxWeight: pr.max_weight,
        maxReps: pr.max_reps,
        date: new Date(pr.date),
      }));

      set({ sessions, personalRecords });
    } catch (e) {
      console.log('Error loading data:', e);
    }
  },
  getPreviousExerciseData: async (exerciseId: string) => {
    return await getPreviousSessionData(exerciseId);
  },
  checkAndUpdatePR: (exerciseId: string, weight: number, reps: number) => {
    const { personalRecords } = get();
    const existingPR = personalRecords.find(pr => pr.exerciseId === exerciseId);
    if (!existingPR || weight > existingPR.maxWeight || (weight === existingPR.maxWeight && reps > existingPR.maxReps)) {
      return true;
    }
    return false;
  },
  getProgressiveOverloadSuggestion: (exerciseId: string) => {
    const { sessions, exercises } = get();
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return null;

    const exerciseSessions = sessions.filter(s => s.sets.some(set => set.exerciseId === exerciseId));
    if (exerciseSessions.length < 2) return null;

    const lastSession = exerciseSessions[exerciseSessions.length - 1];
    const prevSession = exerciseSessions[exerciseSessions.length - 2];

    const lastWeight = Math.max(...lastSession.sets.filter(s => s.exerciseId === exerciseId).map(s => s.weight));
    const prevWeight = Math.max(...prevSession.sets.filter(s => s.exerciseId === exerciseId).map(s => s.weight));

    const increase = lastWeight > prevWeight ? '+5%' : lastWeight === prevWeight ? 'Maintain' : '-5%';

    return {
      exerciseName: exercise.name,
      lastWeight,
      suggestedWeight: Math.round(lastWeight * 1.05 / 2.5) * 2.5,
      increase,
    };
  },
  bodyMeasurements: [],
  loadBodyMeasurements: async () => {
    try {
      const data = await getBodyMeasurements();
      if (data) {
        // Handle both single object and array format for backward compatibility
        const measurementsArray = Array.isArray(data) ? data : [data];
        set({ bodyMeasurements: measurementsArray as unknown as BodyMeasurement[] });
      } else {
        set({ bodyMeasurements: [] });
      }
    } catch (e) {
      console.log('Error loading body measurements:', e);
      set({ bodyMeasurements: [] });
    }
  },
  saveBodyMeasurements: async (measurement: BodyMeasurement) => {
    const { bodyMeasurements } = get();
    const existing = bodyMeasurements.findIndex(b => b.id === measurement.id);
    let updated;
    if (existing >= 0) {
      updated = [...bodyMeasurements];
      updated[existing] = measurement;
    } else {
      updated = [...bodyMeasurements, measurement];
    }
    set({ bodyMeasurements: updated });
    try {
      // Pass the whole array or the latest. The db.ts expects a single BodyMeasurements object for now
      await dbSaveBodyMeasurements(measurement as any);
    } catch (e) {
      console.log('Error saving body measurements:', e);
    }
  },
  sleepHistory: [],
  loadSleepHistory: async () => {
    try {
      const history = await getSleepHistory();
      // The store uses SleepRecord (with id, quality), but db.ts SleepEntry uses energy instead of quality. 
      // We map it to handle type inconsistencies.
      const mapped = history.map((s: any) => ({
        id: s.id || Date.now().toString() + Math.random(),
        date: s.date,
        hours: s.hours,
        quality: s.quality || s.energy || 5,
        notes: s.notes
      }));
      set({ sleepHistory: mapped });
    } catch (e) {
      console.log('Error loading sleep history:', e);
      set({ sleepHistory: [] });
    }
  },
  saveSleepHistory: async (record: SleepRecord) => {
    const { sleepHistory } = get();
    const existing = sleepHistory.findIndex(s => s.id === record.id || s.date === record.date);
    let updated;
    if (existing >= 0) {
      updated = [...sleepHistory];
      updated[existing] = record;
    } else {
      updated = [...sleepHistory, record];
    }
    set({ sleepHistory: updated });
    try {
      await dbSaveSleepHistory(updated.map(s => ({
        date: s.date,
        hours: s.hours,
        energy: s.quality, // Map quality to energy for db
      })));
    } catch (e) {
      console.log('Error saving sleep history:', e);
    }
  },
  weeklySchedule: [
    { day: 'Monday' },
    { day: 'Tuesday' },
    { day: 'Wednesday' },
    { day: 'Thursday' },
    { day: 'Friday' },
    { day: 'Saturday' },
    { day: 'Sunday' },
  ],
  loadWeeklySchedule: async () => {
    set({
      weeklySchedule: [
        { day: 'Monday' },
        { day: 'Tuesday' },
        { day: 'Wednesday' },
        { day: 'Thursday' },
        { day: 'Friday' },
        { day: 'Saturday' },
        { day: 'Sunday' },
      ]
    });
  },
  updateScheduleItem: (item: WeeklyScheduleItem) => {
    const { weeklySchedule } = get();
    const index = weeklySchedule.findIndex(s => s.day === item.day);
    if (index >= 0) {
      const updated = [...weeklySchedule];
      updated[index] = item;
      set({ weeklySchedule: updated });
    }
  },
  loadSettings: async () => {
    try {
      const loadedSettings = await getSettings();
      if (loadedSettings) {
        const defaults: UserSettings = { unit: 'kg', theme: 'dark', goals: ['Build muscle'], experienceLevel: 'intermediate' };
        const merged = { ...defaults, ...loadedSettings } as unknown as UserSettings;
        
        // Parse array/object fields that might be stored as strings
        if (typeof merged.goals === 'string') {
          try {
            merged.goals = JSON.parse(merged.goals);
          } catch {
            merged.goals = [];
          }
        }
        if (!Array.isArray(merged.goals)) merged.goals = [];

        set({ settings: merged });
      }
      set({ isInitialized: true });
    } catch (e) {
      console.log('Error loading settings:', e);
      set({ isInitialized: true });
    }
  },
  clearHistory: async () => {
    try {
      await clearAllData();
      set({ sessions: [], personalRecords: [] });
    } catch (e) {
      console.log('Error clearing history:', e);
    }
  },
  isInitialized: false,
}));