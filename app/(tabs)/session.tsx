import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../../components/Icon';
import { useWorkoutStore } from '../../stores/workoutStore';

const { width } = Dimensions.get('window');

const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHT = 20;

const calculatePlates = (targetWeight: number): number[] => {
  if (targetWeight <= BAR_WEIGHT) return [];
  const weightPerSide = (targetWeight - BAR_WEIGHT) / 2;
  const plates: number[] = [];
  let remaining = weightPerSide;
  
  for (const plate of AVAILABLE_PLATES) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining -= plate;
    }
  }
  return plates;
};

export default function LiveSession() {
  const router = useRouter();
  const { 
    activeSession, 
    currentWorkout, 
    sessionStartTime, 
    currentExerciseIndex,
    completeSet, 
    logSet,
    addSet,
    removeSet,
    nextExercise,
    prevExercise,
    endSession,
    goToExercise,
    exercises,
    settings 
  } = useWorkoutStore();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [setInputs, setSetInputs] = useState<Record<string, { weight: string; reps: string }>>({});
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [calcWeight, setCalcWeight] = useState('');

  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    if (!isResting || restTime <= 0) return;
    const interval = setInterval(() => {
      setRestTime(t => {
        if (t <= 1) {
          setIsResting(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = async (set: any) => {
    const input = setInputs[set.id] || { weight: '0', reps: '0' };
    const weight = parseFloat(input.weight) || 0;
    const reps = parseInt(input.reps) || 0;
    
    if (weight > 0 && reps > 0) {
      await logSet(set.exerciseId, set.setNumber, reps, weight);
      completeSet(set.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRestTime(90);
      setIsResting(true);
    }
  };

  const handleAddSet = () => {
    if (!currentWorkout) return;
    const exercise = currentWorkout.exercises[currentExerciseIndex];
    const existingSets = activeSession?.sets.filter(s => s.exerciseId === exercise.exerciseId) || [];
    addSet(exercise.exerciseId, existingSets.length + 1);
  };

  const getPlateColor = (weight: number): string => {
    const colors: Record<number, string> = { 25: '#DC2626', 20: '#2563EB', 15: '#F59E0B', 10: '#10B981', 5: '#8B5CF6', 2.5: '#EC4899', 1.25: '#6B7280' };
    return colors[weight] || '#71717A';
  };

  if (!activeSession || !currentWorkout) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
        <View style={styles.emptyState}>
          <Icon name={Icons.dumbbell} size={48} color="#71717A" />
          <Text style={styles.emptyText}>No active workout</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentExercise = currentWorkout.exercises[currentExerciseIndex];
  const exerciseDetails = exercises.find(e => e.id === currentExercise.exerciseId) || exercises[0];
  const exerciseSets = activeSession.sets.filter(s => s.exerciseId === currentExercise.exerciseId);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name={Icons.x} size={24} color="#71717A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{activeSession.workoutName}</Text>
          <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={() => endSession()}>
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {isResting && (
        <View style={styles.restBanner}>
          <Text style={styles.restText}>Rest: {formatTime(restTime)}</Text>
          <TouchableOpacity onPress={() => { setIsResting(false); setRestTime(0); }}>
            <Text style={styles.skipRest}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.exerciseNav}>
        <TouchableOpacity onPress={prevExercise} disabled={currentExerciseIndex === 0}>
          <Icon name={Icons.chevronDown} size={20} color={currentExerciseIndex === 0 ? '#3F3F46' : '#71717A'} />
        </TouchableOpacity>
        <Text style={styles.exerciseCount}>{currentExerciseIndex + 1} / {currentWorkout.exercises.length}</Text>
        <TouchableOpacity onPress={nextExercise} disabled={currentExerciseIndex === currentWorkout.exercises.length - 1}>
          <Icon name={Icons.chevronDown} size={20} color={currentExerciseIndex === currentWorkout.exercises.length - 1 ? '#3F3F46' : '#71717A'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{exerciseDetails.name}</Text>
          <Text style={styles.exerciseMuscles}>{exerciseDetails.muscleGroups.join(' • ')}</Text>
          <View style={styles.exerciseMeta}>
            <Text style={styles.metaText}>{currentExercise.sets} sets × {currentExercise.reps} reps</Text>
          </View>
        </View>

        <View style={styles.setsContainer}>
          <View style={styles.setsHeader}>
            <Text style={styles.setsTitle}>Sets</Text>
            <View style={styles.setsActions}>
              <TouchableOpacity style={styles.plateCalcBtn} onPress={() => setShowPlateCalc(true)}>
                <Icon name={Icons.calculator} size={14} color="#F97316" />
                <Text style={styles.plateCalcText}>Plates</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addSetBtn} onPress={handleAddSet}>
                <Icon name={Icons.plus} size={16} color="#F97316" />
                <Text style={styles.addSetText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {(exerciseSets.length > 0 ? exerciseSets : [...Array(currentExercise.sets)]).map((set, index) => {
            const setNum = index + 1;
            const existingSet = exerciseSets[index];
            const isCompleted = existingSet?.completed;
            
            return (
              <View key={set?.id || `new-${index}`} style={[styles.setRow, isCompleted && styles.setRowCompleted]}>
                <View style={styles.setNumber}>
                  <Text style={[styles.setNumText, isCompleted && styles.setNumCompleted]}>{setNum}</Text>
                </View>
                
                <View style={styles.setInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>kg</Text>
                    <TextInput
                      style={[styles.setInput, isCompleted && styles.setInputCompleted]}
                      value={setInputs[set?.id]?.weight || (existingSet?.weight?.toString() || '')}
                      onChangeText={(text) => setSetInputs(prev => ({ ...prev, [set?.id || '']: { ...prev[set?.id || ''], weight: text } }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#52525B"
                      editable={!isCompleted}
                    />
                  </View>
                  <Text style={styles.inputSep}>×</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>reps</Text>
                    <TextInput
                      style={[styles.setInput, isCompleted && styles.setInputCompleted]}
                      value={setInputs[set?.id]?.reps || (existingSet?.reps?.toString() || '')}
                      onChangeText={(text) => setSetInputs(prev => ({ ...prev, [set?.id || '']: { ...prev[set?.id || ''], reps: text } }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#52525B"
                      editable={!isCompleted}
                    />
                  </View>
                </View>

                {!isCompleted ? (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => set && handleCompleteSet(set)}
                  >
                    <Icon name={Icons.checkCircle} size={24} color="#97C459" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedCheck}>
                    <Icon name={Icons.checkCircle} size={24} color="#97C459" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={showPlateCalc} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.plateCalcModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Plate Calculator</Text>
              <TouchableOpacity onPress={() => setShowPlateCalc(false)}>
                <Icon name={Icons.x} size={20} color="#71717A" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.calcLabel}>Target Weight ({settings.unit})</Text>
            <TextInput
              style={styles.calcInput}
              value={calcWeight}
              onChangeText={setCalcWeight}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#52525B"
            />

            {calcWeight && parseFloat(calcWeight) > 0 && (
              <View style={styles.platesResult}>
                <Text style={styles.platesLabel}>Per side:</Text>
                <View style={styles.platesList}>
                  {calculatePlates(parseFloat(calcWeight)).map((plate, i) => (
                    <View key={i} style={[styles.plateBadge, { backgroundColor: getPlateColor(plate) }]}>
                      <Text style={styles.plateText}>{plate}</Text>
                    </View>
                  ))}
                  {calculatePlates(parseFloat(calcWeight)).length === 0 && parseFloat(calcWeight) <= BAR_WEIGHT && (
                    <Text style={styles.platesEmpty}>Bar only ({BAR_WEIGHT}{settings.unit})</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.barVisual}>
              <View style={styles.barEnd} />
              <View style={styles.barMiddle} />
              <View style={styles.barEnd} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  headerCenter: { alignItems: 'center' },
  workoutName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  timer: { fontSize: 20, fontWeight: '700', color: '#F97316', marginTop: 4 },
  endButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#27272A', borderRadius: 8 },
  endButtonText: { fontSize: 14, color: '#E24B4A', fontWeight: '600' },
  restBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(151, 196, 89, 0.15)', marginHorizontal: 20, padding: 12, borderRadius: 10, marginBottom: 12 },
  restText: { fontSize: 16, fontWeight: '600', color: '#97C459' },
  skipRest: { fontSize: 14, color: '#71717A' },
  exerciseNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 12 },
  exerciseCount: { fontSize: 14, color: '#71717A' },
  content: { flex: 1, paddingHorizontal: 20 },
  exerciseCard: { backgroundColor: '#18181B', borderRadius: 16, padding: 20, marginBottom: 20 },
  exerciseName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  exerciseMuscles: { fontSize: 14, color: '#F97316', textTransform: 'capitalize', marginBottom: 8 },
  exerciseMeta: { flexDirection: 'row', gap: 12 },
  metaText: { fontSize: 14, color: '#71717A' },
  setsContainer: { backgroundColor: '#18181B', borderRadius: 16, padding: 16, marginBottom: 100 },
  setsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  setsTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addSetText: { fontSize: 14, color: '#F97316' },
  setsActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plateCalcBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#27272A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  plateCalcText: { fontSize: 14, color: '#F97316' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  plateCalcModal: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  calcLabel: { fontSize: 14, color: '#71717A', marginBottom: 8 },
  calcInput: { backgroundColor: '#27272A', borderRadius: 12, padding: 16, color: '#fff', fontSize: 24, textAlign: 'center', marginBottom: 20 },
  platesResult: { marginBottom: 24 },
  platesLabel: { fontSize: 14, color: '#71717A', marginBottom: 8 },
  platesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  plateBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  plateText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  platesEmpty: { fontSize: 14, color: '#71717A' },
  barVisual: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  barEnd: { width: 20, height: 40, backgroundColor: '#71717A', borderRadius: 2 },
  barMiddle: { height: 8, backgroundColor: '#71717A', flex: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  setRowCompleted: { opacity: 0.6 },
  setNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  setNumText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  setNumCompleted: { color: '#97C459' },
  setInputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inputLabel: { fontSize: 12, color: '#71717A' },
  setInput: { backgroundColor: '#27272A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 16, width: 60, textAlign: 'center' },
  setInputCompleted: { color: '#71717A' },
  inputSep: { fontSize: 16, color: '#71717A' },
  completeBtn: { padding: 8 },
  completedCheck: { padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#71717A', marginTop: 16, marginBottom: 24 },
  emptyButton: { backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});