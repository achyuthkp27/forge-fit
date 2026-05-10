export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  defaultSets: number;
  defaultReps: number;
  coachingCues: string[];
  isCustom?: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  notes?: string;
  format?: 'normal' | 'amrap' | 'emom' | 'circuit';
  emomMinutes?: number;
  circuitRounds?: number;
  supersetGroup?: number;
}

export interface Workout {
  id: string;
  name: string;
  type: 'gym' | 'home';
  exercises: WorkoutExercise[];
  createdAt: Date;
  muscleGroups?: string[];
}

export interface SetLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  sets: SetLog[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  date: Date;
}

export interface UserSettings {
  unit: 'kg' | 'lb';
  theme: 'dark' | 'light';
  goals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'create_workout' | 'log_set' | 'complete_workout' | 'suggest_workout' | 'update_pr' | 'swap_exercise' | 'progressive_overload' | 'mood_tracking' | 'weekly_summary' | 'exercise_options';
  payload: any;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
  }[];
}