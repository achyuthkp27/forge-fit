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
  demoUrl?: string;
  demoType?: string;
  category?: 'strength' | 'cardio' | 'flexibility';
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName?: string;
  name?: string;
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
  isFavorite?: boolean;
  estimatedDuration?: number;
  timesCompleted?: number;
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
  profileName?: string;
  bodyWeight?: number;
  weeklyGoal?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

// Define specific payload types for each action
export interface CreateWorkoutAction {
  type: 'create_workout';
  payload: WorkoutTemplate;
}

export interface LogSetAction {
  type: 'log_set';
  payload: {
    exercise: Exercise;
    weight: number;
    reps: number;
  };
}

export interface CompleteWorkoutAction {
  type: 'complete_workout';
  payload: {
    notes?: string;
  };
}

export interface SuggestWorkoutAction {
  type: 'suggest_workout';
  payload: {
    preferredType?: 'gym' | 'home' | 'any';
  };
}

export interface UpdatePrAction {
  type: 'update_pr';
  payload: {
    weight: number;
  };
}

export interface SwapExerciseAction {
  type: 'swap_exercise';
  payload: {
    exerciseId: string;
  };
}

export interface ProgressiveOverloadAction {
  type: 'progressive_overload';
  payload: {};
}

export interface MoodTrackingAction {
  type: 'mood_tracking';
  payload: {};
}

export interface WeeklySummaryAction {
  type: 'weekly_summary';
  payload: {};
}

export interface ExerciseOptionsAction {
  type: 'exercise_options';
  payload: {};
}

// Union type for all possible actions
export type ChatAction = 
  | CreateWorkoutAction
  | LogSetAction
  | CompleteWorkoutAction
  | SuggestWorkoutAction
  | UpdatePrAction
  | SwapExerciseAction
  | ProgressiveOverloadAction
  | MoodTrackingAction
  | WeeklySummaryAction
  | ExerciseOptionsAction;

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

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'streak' | 'sessions' | 'prs' | 'consistency';
  unlockedAt?: Date;
  progress?: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
}

export interface SleepRecord {
  id: string;
  date: string;
  hours: number;
  quality: number;
  notes?: string;
}

export interface WeeklyScheduleItem {
  day: string;
  workoutId?: string;
  workoutName?: string;
}