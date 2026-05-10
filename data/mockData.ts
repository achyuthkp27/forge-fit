import { Exercise, Workout, PersonalRecord } from '../types';

export const mockExercises: Exercise[] = [
  { id: '1', name: 'Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Keep feet planted', 'Lower bar to mid-chest'] },
  { id: '2', name: 'Incline Dumbbell Press', muscleGroups: ['chest', 'shoulders'], equipment: 'dumbbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Set bench to 30-45 degrees', 'Control the weight'] },
  { id: '3', name: 'Cable Fly', muscleGroups: ['chest'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Keep slight bend in elbows', 'Squeeze chest'] },
  { id: '4', name: 'Push-Ups', muscleGroups: ['chest', 'triceps'], equipment: 'bodyweight', difficulty: 'beginner', defaultSets: 3, defaultReps: 15, coachingCues: ['Keep body straight', 'Full range of motion'] },
  { id: '5', name: 'Dips', muscleGroups: ['chest', 'triceps'], equipment: 'bodyweight', difficulty: 'intermediate', defaultSets: 3, defaultReps: 8, coachingCues: ['Lean forward slightly', 'Lower to 90 degrees'] },
  { id: '6', name: 'Deadlift', muscleGroups: ['back', 'glutes', 'hamstrings'], equipment: 'barbell', difficulty: 'advanced', defaultSets: 4, defaultReps: 5, coachingCues: ['Keep back flat', 'Drive with legs'] },
  { id: '7', name: 'Pull-Ups', muscleGroups: ['back', 'biceps'], equipment: 'bodyweight', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Pull chest to bar', 'Full extension'] },
  { id: '8', name: 'Barbell Row', muscleGroups: ['back', 'biceps'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Bend over at hips', 'Pull to lower chest'] },
  { id: '9', name: 'Lat Pulldown', muscleGroups: ['back', 'biceps'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 10, coachingCues: ['Lean back slightly', 'Pull to upper chest'] },
  { id: '10', name: 'Seated Cable Row', muscleGroups: ['back'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Keep back straight', 'Pull to abs'] },
  { id: '11', name: 'Overhead Press', muscleGroups: ['shoulders', 'triceps'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Brace core', 'Press straight up'] },
  { id: '12', name: 'Lateral Raises', muscleGroups: ['shoulders'], equipment: 'dumbbell', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Slight bend in elbows', 'Raise to shoulder height'] },
  { id: '13', name: 'Face Pulls', muscleGroups: ['shoulders', 'back'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 15, coachingCues: ['Pull to face level', 'External rotation'] },
  { id: '14', name: 'Arnold Press', muscleGroups: ['shoulders'], equipment: 'dumbbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Rotate as you press', 'Full range of motion'] },
  { id: '15', name: 'Squat', muscleGroups: ['quads', 'glutes', 'hamstrings'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Keep chest up', 'Break at hips'] },
  { id: '16', name: 'Leg Press', muscleGroups: ['quads', 'glutes'], equipment: 'machine', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Feet shoulder-width', 'Lower to 90 degrees'] },
  { id: '17', name: 'Romanian Deadlift', muscleGroups: ['hamstrings', 'glutes'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 10, coachingCues: ['Hinge at hips', 'Feel hamstring stretch'] },
  { id: '18', name: 'Leg Curl', muscleGroups: ['hamstrings'], equipment: 'machine', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Full contraction', 'Control the return'] },
  { id: '19', name: 'Calf Raises', muscleGroups: ['calves'], equipment: 'machine', difficulty: 'beginner', defaultSets: 4, defaultReps: 15, coachingCues: ['Full range', 'Squeeze at top'] },
  { id: '20', name: 'Lunges', muscleGroups: ['quads', 'glutes'], equipment: 'dumbbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Step forward', 'Keep torso upright'] },
  { id: '21', name: 'Barbell Curl', muscleGroups: ['biceps'], equipment: 'barbell', difficulty: 'beginner', defaultSets: 3, defaultReps: 10, coachingCues: ['Keep elbows stationary', 'Squeeze at top'] },
  { id: '22', name: 'Hammer Curl', muscleGroups: ['biceps', 'forearms'], equipment: 'dumbbell', difficulty: 'beginner', defaultSets: 3, defaultReps: 10, coachingCues: ['Neutral grip', 'Full range'] },
  { id: '23', name: 'Tricep Pushdown', muscleGroups: ['triceps'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Keep elbows at sides', 'Full extension'] },
  { id: '24', name: 'Skull Crushers', muscleGroups: ['triceps'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Lower to forehead', 'Keep elbows stable'] },
  { id: '25', name: 'Plank', muscleGroups: ['core'], equipment: 'bodyweight', difficulty: 'beginner', defaultSets: 3, defaultReps: 60, coachingCues: ['Keep body straight', 'Engage core'] },
];

export const mockWorkouts: Workout[] = [
  { id: '1', name: 'Push Day', type: 'gym', exercises: [{ exerciseId: '1', sets: 4, reps: 8 }, { exerciseId: '2', sets: 3, reps: 10 }, { exerciseId: '11', sets: 3, reps: 8 }], createdAt: new Date('2024-01-15'), muscleGroups: ['chest', 'shoulders', 'arms'] },
  { id: '2', name: 'Pull Day', type: 'gym', exercises: [{ exerciseId: '7', sets: 4, reps: 8 }, { exerciseId: '8', sets: 4, reps: 8 }, { exerciseId: '21', sets: 3, reps: 10 }], createdAt: new Date('2024-01-15'), muscleGroups: ['back', 'arms'] },
  { id: '3', name: 'Leg Day', type: 'gym', exercises: [{ exerciseId: '15', sets: 4, reps: 8 }, { exerciseId: '17', sets: 4, reps: 10 }, { exerciseId: '19', sets: 4, reps: 15 }], createdAt: new Date('2024-01-15'), muscleGroups: ['legs', 'glutes'] },
  { id: '4', name: 'Upper Body', type: 'home', exercises: [{ exerciseId: '4', sets: 3, reps: 15 }, { exerciseId: '25', sets: 3, reps: 60 }], createdAt: new Date('2024-01-20'), muscleGroups: ['chest', 'core', 'arms'] },
];

export const mockPersonalRecords: PersonalRecord[] = [
  { id: '1', exerciseId: '1', exerciseName: 'Bench Press', maxWeight: 100, maxReps: 5, date: new Date('2024-03-01') },
  { id: '2', exerciseId: '6', exerciseName: 'Deadlift', maxWeight: 140, maxReps: 5, date: new Date('2024-02-15') },
  { id: '3', exerciseId: '15', exerciseName: 'Squat', maxWeight: 120, maxReps: 8, date: new Date('2024-03-10') },
];

export const muscleGroups = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
export const equipmentTypes = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];