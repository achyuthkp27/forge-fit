import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../components/Icon';
import { useWorkoutStore } from '../stores/workoutStore';
import { getPreviousSessionData } from '../lib/db';
import { calculateNextTargets, getRandomFormTip } from '../lib/progressiveOverload';
import { voiceService } from '../lib/voiceService';

const { width } = Dimensions.get('window');

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeSession, currentWorkout, currentExerciseIndex, sessionStartTime,
    nextExercise, prevExercise, logSet, endSession, exercises, goToExercise
  } = useWorkoutStore();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(20);
  const [currentReps, setCurrentReps] = useState(10);
  const [prevWeight, setPrevWeight] = useState(20);
  const [prevReps, setPrevReps] = useState(10);
  const [currentSet, setCurrentSet] = useState(1);
  const [showRest, setShowRest] = useState(false);
  const [restTime, setRestTime] = useState(90);
  const [restEndTime, setRestEndTime] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [prevSessionData, setPrevSessionData] = useState<{ weight: number; reps: number } | null>(null);
  const [formTip, setFormTip] = useState('');
  // Voice input states
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  const exercise = currentWorkout?.exercises[currentExerciseIndex];
  const exerciseData = useMemo(() => exercises.find(e => e.id === exercise?.exerciseId), [exercises, exercise?.exerciseId]);
  const exerciseName = exerciseData?.name || 'Exercise';
  const totalExercises = useMemo(() => currentWorkout?.exercises.length || 0, [currentWorkout?.exercises]);
  const progress = useMemo(() => totalExercises > 0 ? ((currentExerciseIndex + 1) / totalExercises) * 100 : 0, [currentExerciseIndex, totalExercises]);

  useEffect(() => {
    if (sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStartTime]);

  // Initialize voice recognition
  useEffect(() => {
    const initVoice = async () => {
      try {
        const available = await voiceService.isAvailable();
        if (!available) {
          console.log('Voice recognition not available');
        }
      } catch (error) {
        console.error('Failed to initialize voice service:', error);
      }
    };

    initVoice();
  }, []);

  // Load previous session data and form tip when exercise changes
  useEffect(() => {
    if (exercise?.exerciseId) {
      loadPreviousData();
      // Set random form tip
      setFormTip(getRandomFormTip(exerciseName));
    }
  }, [currentExerciseIndex, exercise?.exerciseId]);

  const loadPreviousData = async () => {
    if (!exercise?.exerciseId) return;
    try {
      const data = await getPreviousSessionData(exercise.exerciseId);
      setPrevSessionData(data);
      if (data) {
        setPrevWeight(data.weight);
        setPrevReps(data.reps);
        // Auto-suggest next targets
        const next = calculateNextTargets(data.weight, data.reps, exercise.reps);
        if (next.weight > data.weight) {
          setCurrentWeight(next.weight);
        }
      }
    } catch (e) {
      console.log('Error loading previous data:', e);
    }
  };

  useEffect(() => {
    if (showRest && restEndTime) {
      restRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000));
        setRestTime(remaining);
        
        if (remaining === 0) {
          setShowRest(false);
          setRestEndTime(null);
          if (restRef.current) clearInterval(restRef.current);
          setRestTime(90);
        }
      }, 500);
    }
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [showRest, restEndTime]);

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
    setRestEndTime(Date.now() + 90 * 1000);
    // Show PR celebration on first set of exercise
    if (currentSet === 1) {
      setShowPRCelebration(true);
      setTimeout(() => setShowPRCelebration(false), 1500);
    }
  };

  // Voice input handling
  const startVoiceInput = async () => {
    try {
      setVoiceError(null);
      setVoiceText('Listening...');
      setIsListening(true);
      
      await voiceService.startListening(
        (result) => {
          setVoiceText(result.text);
          // Process the voice command when we have final results
          if (result.isFinal && result.text.trim().length > 0) {
            processVoiceCommand(result.text);
          }
        },
        (error) => {
          setVoiceError(error);
          setIsListening(false);
          setVoiceText('Tap to speak');
        }
      );
    } catch (error) {
      setVoiceError('Failed to start voice recognition');
      setIsListening(false);
      setVoiceText('Tap to speak');
    }
  };

  const stopVoiceInput = async () => {
    try {
      await voiceService.stopListening();
      setIsListening(false);
      if (!voiceError) {
        setVoiceText('Tap to speak');
      }
    } catch (error) {
      console.error('Error stopping voice input:', error);
    }
  };

  const processVoiceCommand = (text: string) => {
    // Parse voice command for weight and reps
    // Examples: "80 kilograms 8 repetitions", "log 50kg 10 reps", "set weight to 60"
    const cleanedText = text.toLowerCase().trim();
    
    // Extract numbers and units
    const weightMatch = cleanedText.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms?|kgs?)/i);
    const repsMatch = cleanedText.match(/(\d+)\s*(?:reps?|repetitions?)/i);
    
    let updated = false;
    
    if (weightMatch) {
      const weight = parseFloat(weightMatch[1]);
      if (!isNaN(weight) && weight >= 0 && weight <= 500) { // Reasonable weight range
        setCurrentWeight(weight);
        updated = true;
      }
    }
    
    if (repsMatch) {
      const reps = parseInt(repsMatch[1], 10);
      if (!isNaN(reps) && reps >= 1 && reps <= 100) { // Reasonable rep range
        setCurrentReps(reps);
        updated = true;
      }
    }
    
    // Provide feedback
    if (updated) {
      voiceService.speak(`Set to ${currentWeight} kilograms ${currentReps} repetitions`);
    } else {
      voiceService.speak(`Could not understand "${text}". Please try again.`);
    }
    
    // Reset voice input after processing
    setTimeout(() => {
      setVoiceText('Tap to speak');
    }, 1500);
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
          <Icon name={Icons.dumbbell} size={80} color="#3F3F46" accessibilityLabel="Dumbbell" accessible />
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
          <Icon name={Icons.checkCircle} size={100} color="#fff" accessibilityLabel="Check circle" accessible />
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
            <Text style={restStyles.time}>{formatTime(restTime)}</Text>
            <Text style={restStyles.hint}>Tap to skip</Text>
            <View style={restStyles.quickTimes}>
              {[30, 60, 90, 120, 180].map(seconds => (
                <TouchableOpacity
                  key={seconds}
                  style={[restStyles.quickBtn, restTime === seconds && restStyles.quickBtnActive]}
                  onPress={() => { setRestTime(seconds); setRestEndTime(Date.now() + seconds * 1000); }}
                >
                  <Text style={restStyles.quickBtnText}>{seconds}s</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* PR Celebration */}
      {showPRCelebration && (
        <View style={prStyles.overlay}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={prStyles.gradient} />
          <Icon name={Icons.checkCircle} size={80} color="#fff" accessibilityLabel="Check circle" accessible />
          <Text style={prStyles.text}>Great Set!</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.headerIconBtn} accessibilityLabel="Exit workout" accessibilityRole="button">
          <Icon name={Icons.x} size={24} color="#A1A1AA" accessibilityLabel="Close" accessible />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{currentWorkout.name}</Text>
          <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        </View>
        <TouchableOpacity onPress={handleFinish} style={styles.finishBtn} accessibilityLabel="Finish workout" accessibilityRole="button">
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentExerciseIndex + 1} of {totalExercises}</Text>
      </View>

      {/* Exercise card */}
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseNav}>
          <TouchableOpacity style={[styles.navBtn, currentExerciseIndex === 0 && styles.navBtnDisabled]} onPress={prevExercise} disabled={currentExerciseIndex === 0} accessibilityLabel="Previous exercise" accessibilityRole="button">
            <Icon name={Icons.chevronLeft} size={24} color={currentExerciseIndex === 0 ? '#3F3F46' : '#fff'} accessibilityLabel="Previous exercise" accessible />
          </TouchableOpacity>
          
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={2} adjustsFontSizeToFit>{exerciseName}</Text>
            <View style={styles.exerciseMetaBadge}>
              <Text style={styles.exerciseSets}>{exercise?.sets} sets × {exercise?.reps} reps</Text>
            </View>
          </View>
          
          <TouchableOpacity style={[styles.navBtn, currentExerciseIndex === totalExercises - 1 && styles.navBtnDisabled]} onPress={nextExercise} disabled={currentExerciseIndex === totalExercises - 1} accessibilityLabel="Next exercise" accessibilityRole="button">
            <Icon name={Icons.chevronRight} size={24} color={currentExerciseIndex === totalExercises - 1 ? '#3F3F46' : '#fff'} accessibilityLabel="Next exercise" accessible />
          </TouchableOpacity>
        </View>

        {/* Previous Performance & Form Tip */}
        <View style={styles.contextContainer}>
          {prevSessionData && (
            <View style={styles.prevPerformance}>
              <View style={styles.iconCirclePurple}><Icon name={Icons.history} size={12} color="#A78BFA" /></View>
              <Text style={styles.prevText}>Last: <Text style={styles.boldText}>{prevSessionData.weight}kg × {prevSessionData.reps}</Text></Text>
            </View>
          )}

          {formTip && (
            <View style={styles.formTip}>
              <View style={styles.iconCircleAmber}><Icon name={Icons.lightbulb} size={12} color="#FBBF24" /></View>
              <Text style={styles.formTipText}>{formTip}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Current Set Header */}
      <View style={styles.setDisplay}>
        <Text style={styles.setLabel}>SET {currentSet} <Text style={styles.setLabelDim}>OF {exercise?.sets || 4}</Text></Text>
      </View>

       {/* Weight/Reps inputs - Premium Steppers */}
       <View style={styles.inputRow}>
         <View style={styles.inputGroup}>
           <Text style={styles.inputLabel}>Weight (kg)</Text>
           <View style={styles.inputBox}>
             <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentWeight(w => Math.max(0, w - 2.5))} activeOpacity={0.7} accessibilityLabel="Decrease weight" accessibilityRole="button">
               <Text style={styles.inputBtnText}>-</Text>
             </TouchableOpacity>
             <Text style={styles.inputValue}>{currentWeight}</Text>
             <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentWeight(w => w + 2.5)} activeOpacity={0.7} accessibilityLabel="Increase weight" accessibilityRole="button">
               <Text style={styles.inputBtnText}>+</Text>
             </TouchableOpacity>
           </View>
         </View>

         <View style={styles.inputSpacer} />

         <View style={styles.inputGroup}>
           <Text style={styles.inputLabel}>Reps</Text>
           <View style={styles.inputBox}>
             <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentReps(r => Math.max(1, r - 1))} activeOpacity={0.7} accessibilityLabel="Decrease reps" accessibilityRole="button">
               <Text style={styles.inputBtnText}>-</Text>
             </TouchableOpacity>
             <Text style={styles.inputValue}>{currentReps}</Text>
             <TouchableOpacity style={styles.inputBtn} onPress={() => setCurrentReps(r => r + 1)} activeOpacity={0.7} accessibilityLabel="Increase reps" accessibilityRole="button">
               <Text style={styles.inputBtnText}>+</Text>
             </TouchableOpacity>
           </View>
         </View>
       </View>

       {/* Voice Input Section */}
       <View style={styles.voiceContainer}>
         <TouchableOpacity 
           style={[styles.voiceButton, isListening && styles.voiceButtonListening]} 
           onPress={isListening ? stopVoiceInput : startVoiceInput}
           accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
           accessibilityRole="button"
           activeOpacity={0.7}
         >
           <Icon name={Icons.mic} size={16} color={isListening ? '#EF4444' : '#F97316'} />
           <Text style={[styles.voiceButtonText, isListening && styles.voiceButtonTextListening]}>
             {isListening ? 'Listening...' : 'Voice Log'}
           </Text>
         </TouchableOpacity>
         {!isListening && voiceText && voiceText !== 'Tap to speak' && (
           <Text style={styles.voiceFeedbackText}>{voiceText}</Text>
         )}
         {voiceError && (
           <Text style={styles.voiceErrorText}>{voiceError}</Text>
         )}
       </View>

      {/* LOG SET button */}
      <View style={styles.logButtonContainer}>
        <TouchableOpacity style={styles.logButton} onPress={handleLogSet} activeOpacity={0.9} accessibilityLabel="Log set" accessibilityRole="button">
          <LinearGradient colors={['#22C55E', '#15803D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Text style={styles.logButtonText}>LOG SET</Text>
        </TouchableOpacity>
      </View>

      {/* Next/Finish button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNextSet} activeOpacity={0.7} accessibilityRole="button">
        <Text style={styles.nextButtonText} accessibilityLabel={
          currentSet < (exercise?.sets || 4) ? 'Next set' :
           currentExerciseIndex < totalExercises - 1 ? 'Next exercise' : 'Finish workout'
        }>
          {currentSet < (exercise?.sets || 4) ? 'Next Set' :
           currentExerciseIndex < totalExercises - 1 ? 'Next Exercise' : 'Finish Workout'}
           <Text style={{fontSize: 14}}> ➔</Text>
        </Text>
      </TouchableOpacity>

      {/* Exercise list bottom nav */}
      <View style={[styles.exerciseList, { paddingBottom: insets.bottom + 10 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exerciseListContent}>
          {currentWorkout.exercises.map((ex, i) => {
            const fullEx = exercises.find(e => e.id === ex.exerciseId);
            let iconName = Icons.dumbbell;
            if (fullEx?.category === 'cardio') iconName = Icons.flame;
            else if (fullEx?.equipment === 'bodyweight') iconName = Icons.bodyweight;
            else if (fullEx?.equipment === 'cable') iconName = Icons.cable;
            else if (fullEx?.equipment === 'machine') iconName = Icons.machine;
            else if (fullEx?.equipment === 'barbell') iconName = Icons.barbell;
            else if (fullEx?.equipment === 'kettlebell') iconName = Icons.activity;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.exercisePill, i === currentExerciseIndex && styles.exercisePillActive]}
                onPress={() => {
                  goToExercise(i);
                  setCurrentSet(1);
                }}
              >
                <Icon name={iconName} size={14} color={i === currentExerciseIndex ? '#fff' : '#A1A1AA'} />
                <Text style={[styles.exercisePillText, i === currentExerciseIndex && styles.exercisePillTextActive]}>{ex.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  noWorkoutTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 20 },
  noWorkoutDesc: { fontSize: 16, color: '#A1A1AA', textAlign: 'center', marginTop: 12 },
  goBackBtn: { marginTop: 30, paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#F97316', borderRadius: 30, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  goBackText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  headerCenter: { alignItems: 'center' },
  workoutTitle: { fontSize: 13, fontWeight: '600', color: '#A1A1AA', letterSpacing: 0.5, textTransform: 'uppercase' },
  timer: { fontSize: 26, fontWeight: '800', color: '#F97316', fontVariant: ['tabular-nums'], marginTop: 2 },
  finishBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' },
  finishText: { fontSize: 14, color: '#F97316', fontWeight: '600' },
  
  progressContainer: { paddingHorizontal: 20, marginBottom: 16 },
  progressBar: { height: 6, backgroundColor: '#27272A', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#71717A', textAlign: 'center', marginTop: 8, fontWeight: '500' },
  
  exerciseCard: { marginHorizontal: 20, backgroundColor: '#18181B', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  exerciseNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' },
  navBtnDisabled: { opacity: 0.5 },
  exerciseInfo: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  exerciseName: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  exerciseMetaBadge: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#27272A', borderRadius: 12 },
  exerciseSets: { fontSize: 13, color: '#F97316', fontWeight: '600' },
  
  contextContainer: { marginTop: 24, gap: 10 },
  prevPerformance: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
  iconCirclePurple: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center' },
  prevText: { fontSize: 14, color: '#C4B5FD', flex: 1 },
  boldText: { fontWeight: '700', color: '#fff' },
  formTip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  iconCircleAmber: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.2)', justifyContent: 'center', alignItems: 'center' },
  formTipText: { fontSize: 13, color: '#FCD34D', flex: 1, lineHeight: 18 },
  
  setDisplay: { alignItems: 'center', marginTop: 32, marginBottom: 16 },
  setLabel: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  setLabelDim: { color: '#71717A' },
  
  inputRow: { flexDirection: 'row', paddingHorizontal: 24, justifyContent: 'center' },
  inputSpacer: { width: 16 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 13, color: '#A1A1AA', marginBottom: 10, textAlign: 'center', fontWeight: '500' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 20, padding: 6, borderWidth: 1, borderColor: '#27272A' },
  inputBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' },
  inputBtnText: { fontSize: 24, color: '#A1A1AA', fontWeight: '300', marginTop: -2 },
  inputValue: { flex: 1, fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center', fontVariant: ['tabular-nums'] },
  
  voiceContainer: { alignItems: 'center', marginTop: 24, paddingHorizontal: 24 },
  voiceButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' },
  voiceButtonListening: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  voiceButtonText: { fontSize: 14, fontWeight: '600', color: '#F97316' },
  voiceButtonTextListening: { color: '#EF4444' },
  voiceFeedbackText: { fontSize: 13, color: '#A1A1AA', marginTop: 12, textAlign: 'center' },
  voiceErrorText: { fontSize: 13, color: '#EF4444', marginTop: 12, textAlign: 'center' },

  logButtonContainer: { marginHorizontal: 24, marginTop: 24, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  logButton: { height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logButtonText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  
  nextButton: { alignItems: 'center', paddingVertical: 20, marginTop: 8 },
  nextButtonText: { fontSize: 16, color: '#F97316', fontWeight: '600' },
  
  exerciseList: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0D0D0D', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#18181B' },
  exerciseListContent: { paddingHorizontal: 24, gap: 12, justifyContent: 'center' },
  exercisePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#18181B', borderRadius: 20, borderWidth: 1, borderColor: '#27272A' },
  exercisePillActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  exercisePillText: { fontSize: 14, color: '#A1A1AA', fontWeight: '600' },
  exercisePillTextActive: { color: '#fff' },
  
  completedContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  completedTitle: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 24, textAlign: 'center' },
  completedName: { fontSize: 20, color: '#fff', opacity: 0.9, marginTop: 8, fontWeight: '500' },
  completedTime: { fontSize: 56, fontWeight: '800', color: '#fff', marginTop: 20, fontVariant: ['tabular-nums'] },
  doneBtn: { marginTop: 48, paddingHorizontal: 48, paddingVertical: 18, backgroundColor: '#fff', borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  doneBtnText: { fontSize: 18, fontWeight: '800', color: '#16A34A' },
});

const restStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  restContainer: { height: '55%', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20 },
  gradient: { ...StyleSheet.absoluteFillObject, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  label: { fontSize: 20, color: '#fff', opacity: 0.8, fontWeight: '600', letterSpacing: 2 },
  time: { fontSize: 88, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },
  hint: { fontSize: 16, color: '#fff', opacity: 0.7, marginTop: 10 },
  quickTimes: { flexDirection: 'row', gap: 10, marginTop: 32 },
  quickBtn: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  quickBtnActive: { backgroundColor: '#fff' },
  quickBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

const prStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  gradient: { ...StyleSheet.absoluteFillObject },
  text: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 20, letterSpacing: 1 },
});