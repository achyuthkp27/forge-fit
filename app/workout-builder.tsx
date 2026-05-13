import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '../stores/workoutStore';
import { Icon, Icons } from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { PlateCalculatorModal } from '../components/PlateCalculatorModal';
import { AIGeneratorModal } from '../components/AIGeneratorModal';
import { RestTimerModal } from '../components/RestTimerModal';
import { ExercisePickerModal } from '../components/ExercisePickerModal';

interface WorkoutExerciseInput {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  format?: 'normal' | 'amrap' | 'emom' | 'circuit';
  emomMinutes?: number;
  circuitRounds?: number;
  supersetGroup?: number;
}

export default function WorkoutBuilder() {
  const router = useRouter();
  const { exercises, addWorkout } = useWorkoutStore();

  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState<'gym' | 'home'>('gym');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseInput[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [editingExercise, setEditingExercise] = useState<number | null>(null);

  // AI Workout Generation
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Rest Timer
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Plate Calculator
  const [showPlateCalculator, setShowPlateCalculator] = useState(false);

  // Progressive Overload - calculate next workout values
  const calculateProgressiveOverload = (currentSets: number, currentReps: number, currentWeight: number) => {
    // Simple progression: increase weight by 2.5% or reps by 1-2
    const newWeight = currentWeight > 0 ? Math.round((currentWeight * 1.025) * 2.5) / 2.5 : 0;
    const newReps = currentReps + 1;
    return { sets: currentSets, reps: newReps, weight: newWeight };
  };

  // AI Workout Generator
  const handleGenerateAIWorkout = async (goal: string) => {
    const goalLower = goal.toLowerCase();
    let generatedExercises: WorkoutExerciseInput[] = [];

    // Simple keyword matching for workout generation
    if (goalLower.includes('chest') || goalLower.includes('push') || goalLower.includes('upper body')) {
      generatedExercises = [
        { exerciseId: '1', exerciseName: 'Bench Press', sets: 4, reps: 8 },
        { exerciseId: '2', exerciseName: 'Incline Dumbbell Press', sets: 3, reps: 10 },
        { exerciseId: '3', exerciseName: 'Cable Fly', sets: 3, reps: 12 },
        { exerciseId: '11', exerciseName: 'Overhead Press', sets: 3, reps: 10 },
        { exerciseId: '12', exerciseName: 'Lateral Raises', sets: 3, reps: 12 },
      ];
    } else if (goalLower.includes('back') || goalLower.includes('pull') || goalLower.includes('lat')) {
      generatedExercises = [
        { exerciseId: '7', exerciseName: 'Pull-Ups', sets: 4, reps: 8 },
        { exerciseId: '8', exerciseName: 'Barbell Row', sets: 4, reps: 8 },
        { exerciseId: '9', exerciseName: 'Lat Pulldown', sets: 3, reps: 10 },
        { exerciseId: '10', exerciseName: 'Seated Cable Row', sets: 3, reps: 12 },
        { exerciseId: '21', exerciseName: 'Barbell Curl', sets: 3, reps: 10 },
      ];
    } else if (goalLower.includes('leg') || goalLower.includes('squat') || goalLower.includes('lower body')) {
      generatedExercises = [
        { exerciseId: '15', exerciseName: 'Squat', sets: 4, reps: 8 },
        { exerciseId: '17', exerciseName: 'Romanian Deadlift', sets: 4, reps: 10 },
        { exerciseId: '18', exerciseName: 'Leg Curl', sets: 3, reps: 12 },
        { exerciseId: '19', exerciseName: 'Calf Raises', sets: 4, reps: 15 },
        { exerciseId: '20', exerciseName: 'Lunges', sets: 3, reps: 10 },
      ];
    } else if (goalLower.includes('arm') || goalLower.includes('bicep') || goalLower.includes('tricep')) {
      generatedExercises = [
        { exerciseId: '21', exerciseName: 'Barbell Curl', sets: 4, reps: 10 },
        { exerciseId: '22', exerciseName: 'Hammer Curl', sets: 3, reps: 10 },
        { exerciseId: '23', exerciseName: 'Tricep Pushdown', sets: 3, reps: 12 },
        { exerciseId: '24', exerciseName: 'Skull Crushers', sets: 3, reps: 10 },
        { exerciseId: '5', exerciseName: 'Dips', sets: 3, reps: 8 },
      ];
    } else {
      // Full body default
      generatedExercises = [
        { exerciseId: '15', exerciseName: 'Squat', sets: 3, reps: 10 },
        { exerciseId: '7', exerciseName: 'Pull-Ups', sets: 3, reps: 8 },
        { exerciseId: '1', exerciseName: 'Bench Press', sets: 3, reps: 10 },
        { exerciseId: '21', exerciseName: 'Barbell Curl', sets: 3, reps: 10 },
        { exerciseId: '25', exerciseName: 'Plank', sets: 3, reps: 60 },
      ];
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setWorkoutExercises(prev => [...prev, ...generatedExercises]);
    setShowAIGenerator(false);
    Alert.alert('Success', `Added ${generatedExercises.length} exercises to your workout!`);
  };

  const handleAddExercise = (exercise: any) => {
    const newExercise: WorkoutExerciseInput = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 4,
      reps: 10,
    };
    setWorkoutExercises([...workoutExercises, newExercise]);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = workoutExercises.filter((_, i) => i !== index);
    // Clear superset groups for removed exercise
    setWorkoutExercises(updated.map(ex => ({ ...ex, supersetGroup: ex.supersetGroup === workoutExercises[index]?.supersetGroup ? undefined : ex.supersetGroup })));
  };

  const handleUpdateExercise = (index: number, field: string, value: any) => {
    const updated = [...workoutExercises];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutExercises(updated);
  };

  // Create superset: link current exercise with next one
  const handleCreateSuperset = (index: number) => {
    if (index >= workoutExercises.length - 1) return;
    const updated = [...workoutExercises];
    const groupId = Date.now();
    updated[index].supersetGroup = groupId;
    updated[index + 1].supersetGroup = groupId;
    setWorkoutExercises(updated);
  };

  // Remove superset
  const handleRemoveSuperset = (index: number) => {
    const updated = [...workoutExercises];
    const groupId = updated[index].supersetGroup;
    updated[index].supersetGroup = undefined;
    if (index + 1 < updated.length && updated[index + 1].supersetGroup === groupId) {
      updated[index + 1].supersetGroup = undefined;
    }
    setWorkoutExercises(updated);
  };

  // Get exercises in a superset group
  const getSupersetGroup = (groupId: number) => {
    return workoutExercises.filter(ex => ex.supersetGroup === groupId);
  };

  // Create circuit: link 3+ exercises
  const handleCreateCircuit = (index: number) => {
    if (index >= workoutExercises.length - 2) return;
    const updated = [...workoutExercises];
    const groupId = Date.now();
    updated[index].format = 'circuit';
    updated[index].circuitRounds = 3;
    updated[index].supersetGroup = groupId;
    updated[index + 1].supersetGroup = groupId;
    updated[index + 2].supersetGroup = groupId;
    setWorkoutExercises(updated);
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim() || workoutExercises.length === 0) return;

    const workout = {
      id: Date.now().toString(),
      name: workoutName.trim(),
      type: workoutType,
      exercises: workoutExercises.map((ex, index) => ({
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        order: index,
        format: ex.format,
        emomMinutes: ex.emomMinutes,
        circuitRounds: ex.circuitRounds,
        supersetGroup: ex.supersetGroup,
      })),
      muscleGroups: [...new Set(workoutExercises.flatMap(ex => {
        const exercise = exercises.find(e => e.id === ex.exerciseId);
        return exercise?.muscleGroups || [];
      }))],
      createdAt: new Date(),
      estimatedDuration: 45,
    };

    await addWorkout(workout);
    router.back();
  };

  const getSupersetLabel = (exercise: WorkoutExerciseInput, index: number) => {
    if (!exercise.supersetGroup) return null;
    const group = getSupersetGroup(exercise.supersetGroup);
    if (group.length < 2) return null;
    const isFirst = group[0].exerciseId === exercise.exerciseId;
    return isFirst ? `Superset (${group.length} exercises)` : null;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name={Icons.x} size={24} color="#71717A" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Workout</Text>
        <TouchableOpacity
          style={[styles.saveButton, (!workoutName.trim() || workoutExercises.length === 0) && styles.saveButtonDisabled]}
          onPress={handleSaveWorkout}
          disabled={!workoutName.trim() || workoutExercises.length === 0}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Workout Name</Text>
          <TextInput
            style={styles.input}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="e.g., Push Day"
            placeholderTextColor="#52525B"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, workoutType === 'gym' && styles.typeButtonActive]}
              onPress={() => setWorkoutType('gym')}
            >
              <Icon name={Icons.dumbbell} size={18} color={workoutType === 'gym' ? '#fff' : '#71717A'} />
              <Text style={[styles.typeText, workoutType === 'gym' && styles.typeTextActive]}>Gym</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, workoutType === 'home' && styles.typeButtonActive]}
              onPress={() => setWorkoutType('home')}
            >
              <Icon name={Icons.home} size={18} color={workoutType === 'home' ? '#fff' : '#71717A'} />
              <Text style={[styles.typeText, workoutType === 'home' && styles.typeTextActive]}>Home</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Exercises ({workoutExercises.length})</Text>
            <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowExercisePicker(true)}>
              <Icon name={Icons.plus} size={16} color="#F97316" />
              <Text style={styles.addExerciseText}>Add</Text>
            </TouchableOpacity>
          </View>

          {workoutExercises.map((ex, index) => {
            const supersetLabel = getSupersetLabel(ex, index);
            const isInCircuit = ex.format === 'circuit';
            const isLastInGroup = !workoutExercises[index + 1] || workoutExercises[index + 1].supersetGroup !== ex.supersetGroup;
            const isFirstInGroup = index === 0 || workoutExercises[index - 1]?.supersetGroup !== ex.supersetGroup;

            return (
              <View key={index} style={[styles.exerciseCard, isInCircuit && styles.circuitCard]}>
                {isFirstInGroup && supersetLabel && (
                  <View style={styles.supersetBadge}>
                    <Icon name={Icons.activity} size={14} color="#F97316" />
                    <Text style={styles.supersetText}>{supersetLabel}</Text>
                  </View>
                )}

                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                  <View style={styles.exerciseActions}>
                    <TouchableOpacity onPress={() => setEditingExercise(index === editingExercise ? null : index)}>
                      <Icon name={Icons.edit2} size={18} color="#F97316" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveExercise(index)} style={{ marginLeft: 12 }}>
                      <Icon name={Icons.x} size={18} color="#71717A" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.exerciseInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Sets</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={ex.sets.toString()}
                      onChangeText={(text) => handleUpdateExercise(index, 'sets', parseInt(text) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  {ex.format !== 'amrap' && ex.format !== 'circuit' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={ex.reps.toString()}
                        onChangeText={(text) => handleUpdateExercise(index, 'reps', parseInt(text) || 0)}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>

                {/* Format buttons */}
                <View style={styles.formatRow}>
                  <TouchableOpacity
                    style={[styles.formatBtn, ex.format === 'amrap' && styles.formatBtnActive]}
                    onPress={() => handleUpdateExercise(index, 'format', ex.format === 'amrap' ? 'normal' : 'amrap')}
                  >
                    <Text style={[styles.formatText, ex.format === 'amrap' && styles.formatTextActive]}>AMRAP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatBtn, ex.format === 'emom' && styles.formatBtnActive]}
                    onPress={() => handleUpdateExercise(index, 'format', ex.format === 'emom' ? 'normal' : 'emom')}
                  >
                    <Text style={[styles.formatText, ex.format === 'emom' && styles.formatTextActive]}>EMOM</Text>
                  </TouchableOpacity>
                </View>

                {ex.format === 'emom' && (
                  <View style={styles.emomRow}>
                    <Text style={styles.emomLabel}>Every</Text>
                    <TextInput
                      style={styles.emomInput}
                      value={ex.emomMinutes?.toString() || '10'}
                      onChangeText={(text) => handleUpdateExercise(index, 'emomMinutes', parseInt(text) || 10)}
                      keyboardType="numeric"
                    />
                    <Text style={styles.emomLabel}>minutes</Text>
                  </View>
                )}

                {ex.format === 'circuit' && (
                  <View style={styles.emomRow}>
                    <Text style={styles.emomLabel}>Rounds:</Text>
                    <TextInput
                      style={styles.emomInput}
                      value={ex.circuitRounds?.toString() || '3'}
                      onChangeText={(text) => handleUpdateExercise(index, 'circuitRounds', parseInt(text) || 3)}
                      keyboardType="numeric"
                    />
                  </View>
                )}

                {/* Superset/Circuit actions */}
                {index < workoutExercises.length - 1 && !ex.supersetGroup && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleCreateSuperset(index)}>
                      <Icon name={Icons.plus} size={14} color="#F97316" />
                      <Text style={styles.actionText}>Superset with next</Text>
                    </TouchableOpacity>
                    {index < workoutExercises.length - 2 && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleCreateCircuit(index)}>
                        <Icon name={Icons.activity} size={14} color="#8B5CF6" />
                        <Text style={styles.actionTextPurple}>Create Circuit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {ex.supersetGroup && isLastInGroup && (
                  <TouchableOpacity style={styles.removeSuperset} onPress={() => handleRemoveSuperset(index)}>
                    <Text style={styles.removeSupersetText}>Remove grouping</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {workoutExercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Icon name={Icons.dumbbell} size={32} color="#3F3F46" />
              <Text style={styles.emptyText}>No exercises added yet</Text>
              <Text style={styles.emptySubtext}>Add exercises to build your workout</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.helpSection} onPress={() => setShowHelp(!showHelp)}>
          <View style={styles.helpHeader}>
            <Text style={styles.helpTitle}>Format Guide</Text>
            <Icon name={showHelp ? Icons.chevronUp : Icons.chevronDown} size={18} color="#71717A" />
          </View>
          {showHelp && (
            <>
              <View style={styles.helpItem}>
                <Text style={styles.helpLabel}>AMRAP</Text>
                <Text style={styles.helpDesc}>As Many Reps As Possible in fixed time</Text>
              </View>
              <View style={styles.helpItem}>
                <Text style={styles.helpLabel}>EMOM</Text>
                <Text style={styles.helpDesc}>Every Minute On the Minute</Text>
              </View>
              <View style={styles.helpItem}>
                <Text style={styles.helpLabel}>Superset</Text>
                <Text style={styles.helpDesc}>Do 2 exercises back-to-back, rest after both</Text>
              </View>
              <View style={styles.helpItem}>
                <Text style={styles.helpLabel}>Circuit</Text>
                <Text style={styles.helpDesc}>3+ exercises in a row, then rest</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowAIGenerator(true)}>
            <Icon name={Icons.zap} size={20} color="#F97316" />
            <Text style={styles.quickActionText}>AI Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowPlateCalculator(true)}>
            <Icon name={Icons.circle} size={20} color="#8B5CF6" />
            <Text style={styles.quickActionText}>Plate Calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => setShowRestTimer(true)}>
            <Icon name={Icons.timer} size={20} color="#22C55E" />
            <Text style={styles.quickActionText}>Rest Timer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Workout Generator Modal */}
      <AIGeneratorModal
        visible={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={handleGenerateAIWorkout}
      />

      {/* Rest Timer Modal */}
      <RestTimerModal
        visible={showRestTimer}
        onClose={() => setShowRestTimer(false)}
      />

      <PlateCalculatorModal
        visible={showPlateCalculator}
        onClose={() => setShowPlateCalculator(false)}
      />

      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onAddExercise={handleAddExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  saveButton: { backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonDisabled: { backgroundColor: '#3F3F46' },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#71717A', marginBottom: 8 },
  input: { backgroundColor: '#18181B', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#18181B', borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  typeButtonActive: { borderColor: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' },
  typeText: { fontSize: 14, color: '#71717A', fontWeight: '500' },
  typeTextActive: { color: '#F97316' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addExerciseText: { fontSize: 14, color: '#F97316' },
  exerciseCard: { backgroundColor: '#18181B', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  circuitCard: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
  supersetBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, backgroundColor: 'rgba(249, 115, 22, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  supersetText: { fontSize: 12, color: '#F97316', fontWeight: '600' },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exerciseActions: { flexDirection: 'row', alignItems: 'center' },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  exerciseInputs: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  inputGroup: { alignItems: 'center' },
  inputLabel: { fontSize: 12, color: '#71717A', marginBottom: 4 },
  smallInput: { backgroundColor: '#27272A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 16, width: 70, textAlign: 'center' },
  formatRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  formatBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#27272A' },
  formatBtnActive: { backgroundColor: '#F97316' },
  formatText: { fontSize: 13, color: '#71717A', fontWeight: '600' },
  formatTextActive: { color: '#fff' },
  emomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  emomLabel: { fontSize: 14, color: '#71717A' },
  emomInput: { backgroundColor: '#27272A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 16, width: 60, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#27272A', borderRadius: 10 },
  actionText: { fontSize: 12, color: '#F97316' },
  actionTextPurple: { fontSize: 12, color: '#8B5CF6' },
  removeSuperset: { marginTop: 8 },
  removeSupersetText: { fontSize: 12, color: '#EF4444' },
  emptyExercises: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#71717A', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#52525B', marginTop: 4 },
  helpSection: { backgroundColor: '#18181B', borderRadius: 12, padding: 16, marginBottom: 40 },
  helpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helpTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  helpItem: { flexDirection: 'row', marginBottom: 8 },
  helpLabel: { fontSize: 13, color: '#F97316', fontWeight: '600', width: 80 },
  helpDesc: { fontSize: 13, color: '#71717A', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 40, paddingTop: 8 },
  quickActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: '#18181B', borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  quickActionText: { fontSize: 13, color: '#fff', fontWeight: '500' },
});