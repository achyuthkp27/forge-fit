import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../components/Icon';
import { useWorkoutStore } from '../stores/workoutStore';

const { width } = Dimensions.get('window');

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeSession, currentWorkout, currentExerciseIndex,
    nextExercise, prevExercise, logSet, endSession
  } = useWorkoutStore();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(20);
  const [currentReps, setCurrentReps] = useState(10);
  const [prevWeight, setPrevWeight] = useState(20);
  const [prevReps, setPrevReps] = useState(10);
  const [currentSet, setCurrentSet] = useState(1);
  const [showRest, setShowRest] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPRCelebration, setShowPRCelebration] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  const exercise = currentWorkout?.exercises[currentExerciseIndex];
  const totalExercises = currentWorkout?.exercises.length || 0;
  const progress = totalExercises > 0 ? ((currentExerciseIndex + 1) / totalExercises) * 100 : 0;

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (showRest && restTime > 0) {
      restRef.current = setInterval(() => {
        setRestTime(t => {
          if (t <= 1) {
            setShowRest(false);
            return 90;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [showRest]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleLogSet = async () => {
    if (!exercise) return;
    await logSet(exercise.exerciseId, currentSet, currentReps, currentWeight);
    setPrevWeight(currentWeight);
    setPrevReps(currentReps);
    setShowRest(true);
    setRestTime(90);
    // Show PR celebration on first set of exercise
    if (currentSet === 1) {
      setShowPRCelebration(true);
      setTimeout(() => setShowPRCelebration(false), 1500);
    }
  };

  const handleNextSet = () => {
    if (currentSet < (exercise?.sets || 4)) {
      setCurrentSet(s => s + 1);
      // Carry forward previous set values
      setCurrentWeight(prevWeight);
      setCurrentReps(prevReps);
    } else if (currentExerciseIndex < totalExercises - 1) {
      nextExercise();
      setCurrentSet(1);
      // Reset to defaults when moving to new exercise
      setCurrentWeight(20);
      setCurrentReps(10);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsCompleted(true);
    await endSession();
  };

  const handleExit = () => {
    Alert.alert('Exit Workout?', 'Your progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => { endSession(); router.back(); } }
    ]);
  };

  // No workout started - show start screen
  if (!currentWorkout || !activeSession) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
        <View style={styles.centerContent}>
          <Icon name={Icons.dumbbell} size={80} color="#3F3F46" />
          <Text style={styles.noWorkoutTitle}>No Active Workout</Text>
          <Text style={styles.noWorkoutDesc}>Go to Workouts tab and tap play to start</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Completion screen
  if (isCompleted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#22C55E', '#16A34A']} style={StyleSheet.absoluteFill} />
        <View style={styles.completedContent}>
          <Icon name={Icons.checkCircle} size={100} color="#fff" />
          <Text style={styles.completedTitle}>Workout Complete!</Text>
          <Text style={styles.completedName}>{currentWorkout.name}</Text>
          <Text style={styles.completedTime}>{formatTime(elapsedTime)}</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      {/* Rest overlay */}
      {showRest && (
        <TouchableOpacity style={restStyles.overlay} activeOpacity={1} onPress={() => setShowRest(false)}>
          <View style={restStyles.restContainer}>
            <LinearGradient colors={['#F97316', '#EA580C']} style={restStyles.gradient} />
            <Text style={restStyles.label}>REST</Text>
            <Text style={restStyles.time}>{restTime}</Text>
            <Text style={restStyles.hint}>Tap to skip</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* PR Celebration */}
      {showPRCelebration && (
        <View style={prStyles.overlay}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={prStyles.gradient} />
          <Icon name={Icons.checkCircle} size={80} color="#fff" />
          <Text style={prStyles.text}>Great Set!</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit}>
          <Icon name={Icons.x} size={28} color="#71717A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{currentWorkout.name}</Text>
          <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        </View>
        <TouchableOpacity onPress={handleFinish} style={styles.finishBtn}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>{currentExerciseIndex + 1} of {totalExercises}</Text>

      {/* Exercise card */}
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseNav}>
          <TouchableOpacity style={styles.navBtn} onPress={prevExercise} disabled={currentExerciseIndex === 0}>
            <Icon name={Icons.chevronLeft} size={28} color={currentExerciseIndex === 0 ? '#3F3F46' : '#F97316'} />
          </TouchableOpacity>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise?.name}</Text>
            <Text style={styles.exerciseSets}>{exercise?.sets} sets × {exercise?.reps} reps</Text>
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={nextExercise} disabled={currentExerciseIndex === totalExercises - 1}>
            <Icon name={Icons.chevronRight} size={28} color={currentExerciseIndex === totalExercises - 1 ? '#3F3F46' : '#F97316'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Set */}
      <View style={styles.setDisplay}>
        <Text style={styles.setLabel}>SET {currentSet} OF {exercise?.sets || 4}</Text>
      </View>

      {/* Weight/Reps inputs */}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <View style={styles.inputBox}>
            <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentWeight(w => Math.max(0, w - 2.5))} activeOpacity={0.7}>
              <Text style={styles.inputBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.inputValue}>{currentWeight}</Text>
            <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentWeight(w => w + 2.5)} activeOpacity={0.7}>
              <Text style={styles.inputBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <View style={styles.inputBox}>
            <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentReps(r => Math.max(1, r - 1))} activeOpacity={0.7}>
              <Text style={styles.inputBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.inputValue}>{currentReps}</Text>
            <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentReps(r => r + 1)} activeOpacity={0.7}>
              <Text style={styles.inputBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* LOG SET button */}
      <TouchableOpacity style={styles.logButton} onPress={handleLogSet} activeOpacity={0.8}>
        <LinearGradient colors={['#22C55E', '#16A34A']} style={StyleSheet.absoluteFill} />
        <Text style={styles.logButtonText}>LOG SET</Text>
      </TouchableOpacity>

      {/* Next/Finish button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNextSet} activeOpacity={0.7}>
        <Text style={styles.nextButtonText}>
          {currentSet < (exercise?.sets || 4) ? 'Next Set →' :
           currentExerciseIndex < totalExercises - 1 ? 'Next Exercise →' : 'Finish Workout'}
        </Text>
      </TouchableOpacity>

      {/* Exercise list */}
      <View style={styles.exerciseList}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseListContent}>
          {currentWorkout.exercises.map((ex, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.exercisePill, i === currentExerciseIndex && styles.exercisePillActive]}
              onPress={() => {
                useWorkoutStore.getState().goToExercise(i);
                setCurrentSet(1);
              }}
            >
              <Text style={[styles.exercisePillText, i === currentExerciseIndex && styles.exercisePillTextActive]}>{ex.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  noWorkoutTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 20 },
  noWorkoutDesc: { fontSize: 16, color: '#71717A', textAlign: 'center', marginTop: 12 },
  goBackBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 14, backgroundColor: '#F97316', borderRadius: 25 },
  goBackText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  workoutTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  timer: { fontSize: 24, fontWeight: '700', color: '#F97316', marginTop: 4 },
  finishBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#18181B', borderRadius: 20, borderWidth: 1, borderColor: '#27272A' },
  finishText: { fontSize: 14, color: '#71717A', fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: '#27272A', marginHorizontal: 20, borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 4 },
  progressText: { fontSize: 14, color: '#71717A', textAlign: 'center', marginTop: 8 },
  exerciseCard: { margin: 20, backgroundColor: '#18181B', borderRadius: 20, padding: 24 },
  exerciseNav: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' },
  exerciseInfo: { flex: 1, alignItems: 'center' },
  exerciseName: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center' },
  exerciseSets: { fontSize: 16, color: '#F97316', marginTop: 8 },
  setDisplay: { alignItems: 'center', marginBottom: 20 },
  setLabel: { fontSize: 18, fontWeight: '600', color: '#71717A' },
  inputRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 16 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 14, color: '#71717A', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 16, padding: 6 },
  inputBtn: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' },
  inputBtnText: { fontSize: 28, color: '#F97316', fontWeight: '600' },
  inputValue: { flex: 1, fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center' },
  logButton: { marginHorizontal: 20, marginTop: 24, height: 70, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logButtonText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  nextButton: { alignItems: 'center', paddingVertical: 16 },
  nextButtonText: { fontSize: 16, color: '#F97316', fontWeight: '600' },
  exerciseList: { position: 'absolute', bottom: 20, left: 0, right: 0 },
  exerciseListContent: { paddingHorizontal: 20, gap: 10, justifyContent: 'center' },
  exercisePill: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#18181B', borderRadius: 16, borderWidth: 1, borderColor: '#27272A' },
  exercisePillActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  exercisePillText: { fontSize: 14, color: '#71717A', fontWeight: '500' },
  exercisePillTextActive: { color: '#fff' },
  completedContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  completedTitle: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 24 },
  completedName: { fontSize: 18, color: '#fff', opacity: 0.8, marginTop: 8 },
  completedTime: { fontSize: 48, fontWeight: '700', color: '#fff', marginTop: 16 },
  doneBtn: { marginTop: 40, paddingHorizontal: 48, paddingVertical: 16, backgroundColor: '#fff', borderRadius: 30 },
  doneBtnText: { fontSize: 18, fontWeight: '700', color: '#22C55E' },
});

const restStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  restContainer: { height: '50%', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  gradient: { ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  label: { fontSize: 24, color: '#fff', opacity: 0.8 },
  time: { fontSize: 80, fontWeight: '700', color: '#fff' },
  hint: { fontSize: 18, color: '#fff', opacity: 0.6, marginTop: 20 },
});

const prStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  gradient: { ...StyleSheet.absoluteFillObject },
  text: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 16 },
});