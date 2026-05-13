import { Exercise, Workout, PersonalRecord } from '../types';

// Exercise categories
const exerciseCategories: Record<string, 'strength' | 'cardio' | 'flexibility'> = {
  '1': 'strength', '2': 'strength', '3': 'strength', '4': 'strength', '5': 'strength',
  '6': 'strength', '7': 'strength', '8': 'strength', '9': 'strength', '10': 'strength',
  '11': 'strength', '12': 'strength', '13': 'strength', '14': 'strength', '15': 'strength',
  '16': 'strength', '17': 'strength', '18': 'strength', '19': 'strength', '20': 'strength',
  '21': 'strength', '22': 'strength', '23': 'strength', '24': 'strength', '25': 'flexibility',
};

// Demo images from Wikimedia Commons (free, reliable, CC license)
// In production, fetch from Wger API: https://wger.de/api/v2/exercisebaseinfo/
const exerciseDemos: Record<string, string> = {
  '1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Barbell_bench_press.svg/640px-Barbell_bench_press.svg.png',
  '2': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8:Dumbbell_incline_bench_press.svg/640px-Dumbbell_incline_bench_press.svg.png',
  '3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c:Cable_crossover.svg/640px-Cable_crossover.svg.png',
  '4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Pushup.svg/640px-Pushup.svg.png',
  '5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14:Parallel_bar_dip.svg/640px-Parallel_bar_dip.svg.png',
  '6': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Barbell_deadlift.svg/640px-Barbell_deadlift.svg.png',
  '7': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42:Pullup.svg/640px-Pullup.svg.png',
  '8': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c:Barbell_row.svg/640px-Barbell_row.svg.png',
  '9': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57:Latin_pulldown.svg/640px-Latin_pulldown.svg.png',
  '10': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c:Seated_cable_row.svg/640px-Seated_cable_row.svg.png',
  '11': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e:Overhead_press.svg/640px-Overhead_press.svg.png',
  '12': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14:Dumbbell_lateral_raise.svg/640px-Dumbbell_lateral_raise.svg.png',
  '13': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d:Face_pull.svg/640px-Face_pull.svg.png',
  '14': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b:Arnold_press.svg/640px-Arnold_press.svg.png',
  '15': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2:Squats.svg/640px-Squats.svg.png',
  '16': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96:Leg_press.svg/640px-Leg_press.svg.png',
  '17': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76:Romanian_deadlift.svg/640px-Romanian_deadlift.svg.png',
  '18': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f:Leg_curl.svg/640px-Leg_curl.svg.png',
  '19': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a:Standing_calf_raise.svg/640px-Standing_calf_raise.svg.png',
  '20': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88:Lunge.svg/640px-Lunge.svg.png',
  '21': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6:Barbell_curl.svg/640px-Barbell_curl.svg.png',
  '22': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07:Hammer_curl.svg/640px-Hammer_curl.svg.png',
  '23': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5:Tricep_pushdown.svg/640px-Tricep_pushdown.svg.png',
  '24': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16:Skull_crusher.svg/640px-Skull_crusher.svg.png',
  '25': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a:Plank.svg/640px-Plank.svg.png',
};

export const mockExercises: Exercise[] = [
  { id: '1', name: 'Bench Press', muscleGroups: ['Chest', 'Shoulders', 'Arms'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Keep feet planted', 'Lower bar to mid-chest'], demoUrl: exerciseDemos['1'], category: 'strength' },
  { id: '2', name: 'Incline Dumbbell Press', muscleGroups: ['Chest', 'Shoulders'], equipment: 'dumbbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Set bench to 30-45 degrees', 'Control the weight'], demoUrl: exerciseDemos['2'], category: 'strength' },
  { id: '3', name: 'Cable Fly', muscleGroups: ['Chest'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Keep slight bend in elbows', 'Squeeze chest'], demoUrl: exerciseDemos['3'], category: 'strength' },
  { id: '4', name: 'Push-Ups', muscleGroups: ['Chest', 'Arms'], equipment: 'bodyweight', difficulty: 'beginner', defaultSets: 3, defaultReps: 15, coachingCues: ['Keep body straight', 'Full range of motion'], demoUrl: exerciseDemos['4'], category: 'strength' },
  { id: '5', name: 'Dips', muscleGroups: ['Chest', 'Arms'], equipment: 'bodyweight', difficulty: 'intermediate', defaultSets: 3, defaultReps: 8, coachingCues: ['Lean forward slightly', 'Lower to 90 degrees'], demoUrl: exerciseDemos['5'], category: 'strength' },
  { id: '6', name: 'Deadlift', muscleGroups: ['Back', 'Legs'], equipment: 'barbell', difficulty: 'advanced', defaultSets: 4, defaultReps: 5, coachingCues: ['Keep back flat', 'Drive with legs'], demoUrl: exerciseDemos['6'], category: 'strength' },
  { id: '7', name: 'Pull-Ups', muscleGroups: ['Back', 'Arms'], equipment: 'bodyweight', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Pull chest to bar', 'Full extension'], demoUrl: exerciseDemos['7'], category: 'strength' },
  { id: '8', name: 'Barbell Row', muscleGroups: ['Back', 'Arms'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Bend over at hips', 'Pull to lower chest'], demoUrl: exerciseDemos['8'], category: 'strength' },
  { id: '9', name: 'Lat Pulldown', muscleGroups: ['Back', 'Arms'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 10, coachingCues: ['Lean back slightly', 'Pull to upper chest'], demoUrl: exerciseDemos['9'], category: 'strength' },
  { id: '10', name: 'Seated Cable Row', muscleGroups: ['Back'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Keep back straight', 'Pull to abs'], demoUrl: exerciseDemos['10'], category: 'strength' },
  { id: '11', name: 'Overhead Press', muscleGroups: ['Shoulders', 'Arms'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Brace core', 'Press straight up'], demoUrl: exerciseDemos['11'], category: 'strength' },
  { id: '12', name: 'Lateral Raises', muscleGroups: ['Shoulders'], equipment: 'dumbbell', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Slight bend in elbows', 'Raise to shoulder height'], demoUrl: exerciseDemos['12'], category: 'strength' },
  { id: '13', name: 'Face Pulls', muscleGroups: ['Shoulders', 'Back'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 15, coachingCues: ['Pull to face level', 'External rotation'], demoUrl: exerciseDemos['13'], category: 'strength' },
  { id: '14', name: 'Arnold Press', muscleGroups: ['Shoulders'], equipment: 'dumbbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Rotate as you press', 'Full range of motion'], demoUrl: exerciseDemos['14'], category: 'strength' },
  { id: '15', name: 'Squat', muscleGroups: ['Legs'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 8, coachingCues: ['Keep chest up', 'Break at hips'], demoUrl: exerciseDemos['15'], category: 'strength' },
  { id: '16', name: 'Leg Press', muscleGroups: ['Legs'], equipment: 'machine', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Feet shoulder-width', 'Lower to 90 degrees'], demoUrl: exerciseDemos['16'], category: 'strength' },
  { id: '17', name: 'Romanian Deadlift', muscleGroups: ['Legs'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 4, defaultReps: 10, coachingCues: ['Hinge at hips', 'Feel hamstring stretch'], demoUrl: exerciseDemos['17'], category: 'strength' },
  { id: '18', name: 'Leg Curl', muscleGroups: ['Legs'], equipment: 'machine', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Full contraction', 'Control the return'], demoUrl: exerciseDemos['18'], category: 'strength' },
  { id: '19', name: 'Calf Raises', muscleGroups: ['Legs'], equipment: 'machine', difficulty: 'beginner', defaultSets: 4, defaultReps: 15, coachingCues: ['Full range', 'Squeeze at top'], demoUrl: exerciseDemos['19'], category: 'strength' },
  { id: '20', name: 'Lunges', muscleGroups: ['Legs'], equipment: 'dumbbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Step forward', 'Keep torso upright'], demoUrl: exerciseDemos['20'], category: 'strength' },
  { id: '21', name: 'Barbell Curl', muscleGroups: ['Arms'], equipment: 'barbell', difficulty: 'beginner', defaultSets: 3, defaultReps: 10, coachingCues: ['Keep elbows stationary', 'Squeeze at top'], demoUrl: exerciseDemos['21'], category: 'strength' },
  { id: '22', name: 'Hammer Curl', muscleGroups: ['Arms'], equipment: 'dumbbell', difficulty: 'beginner', defaultSets: 3, defaultReps: 10, coachingCues: ['Neutral grip', 'Full range'], demoUrl: exerciseDemos['22'], category: 'strength' },
  { id: '23', name: 'Tricep Pushdown', muscleGroups: ['Arms'], equipment: 'cable', difficulty: 'beginner', defaultSets: 3, defaultReps: 12, coachingCues: ['Keep elbows at sides', 'Full extension'], demoUrl: exerciseDemos['23'], category: 'strength' },
  { id: '24', name: 'Skull Crushers', muscleGroups: ['Arms'], equipment: 'barbell', difficulty: 'intermediate', defaultSets: 3, defaultReps: 10, coachingCues: ['Lower to forehead', 'Keep elbows stable'], demoUrl: exerciseDemos['24'], category: 'strength' },
  { id: '25', name: 'Plank', muscleGroups: ['Core'], equipment: 'bodyweight', difficulty: 'beginner', defaultSets: 3, defaultReps: 60, coachingCues: ['Keep body straight', 'Engage core'], demoUrl: exerciseDemos['25'], category: 'flexibility' },
];

export const mockWorkouts: Workout[] = [
  { id: '1', name: 'Push Day', type: 'gym', exercises: [{ exerciseId: '1', sets: 4, reps: 8 }, { exerciseId: '2', sets: 3, reps: 10 }, { exerciseId: '11', sets: 3, reps: 8 }], createdAt: new Date('2024-01-15'), muscleGroups: ['Chest', 'Shoulders', 'Arms'] },
  { id: '2', name: 'Pull Day', type: 'gym', exercises: [{ exerciseId: '7', sets: 4, reps: 8 }, { exerciseId: '8', sets: 4, reps: 8 }, { exerciseId: '21', sets: 3, reps: 10 }], createdAt: new Date('2024-01-15'), muscleGroups: ['Back', 'Arms'] },
  { id: '3', name: 'Leg Day', type: 'gym', exercises: [{ exerciseId: '15', sets: 4, reps: 8 }, { exerciseId: '17', sets: 4, reps: 10 }, { exerciseId: '19', sets: 4, reps: 15 }], createdAt: new Date('2024-01-15'), muscleGroups: ['Legs'] },
  { id: '4', name: 'Upper Body', type: 'home', exercises: [{ exerciseId: '4', sets: 3, reps: 15 }, { exerciseId: '25', sets: 3, reps: 60 }], createdAt: new Date('2024-01-20'), muscleGroups: ['Chest', 'Core', 'Arms'] },
];

export const mockPersonalRecords: PersonalRecord[] = [
  { id: '1', exerciseId: '1', exerciseName: 'Bench Press', maxWeight: 100, maxReps: 5, date: new Date('2024-03-01') },
  { id: '2', exerciseId: '6', exerciseName: 'Deadlift', maxWeight: 140, maxReps: 5, date: new Date('2024-02-15') },
  { id: '3', exerciseId: '15', exerciseName: 'Squat', maxWeight: 120, maxReps: 8, date: new Date('2024-03-10') },
];

export const muscleGroups = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];
export const equipmentTypes = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];