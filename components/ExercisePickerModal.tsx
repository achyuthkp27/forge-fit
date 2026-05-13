import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { Icon, Icons } from './Icon';
import { Exercise } from '../types';
import { useWorkoutStore } from '../stores/workoutStore';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Exercise) => void;
}

export function ExercisePickerModal({ visible, onClose, onAddExercise }: ExercisePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchExercises, exercises, addExercise } = useWorkoutStore();

  const filteredExercises = searchQuery ? searchExercises(searchQuery) : exercises.slice(0, 10);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleAddCustomExercise = () => {
    const newEx: Exercise = {
      id: Date.now().toString(),
      name: searchQuery,
      muscleGroups: ['Custom'],
      equipment: 'dumbbell',
      difficulty: 'beginner',
      defaultSets: 3,
      defaultReps: 10,
      coachingCues: [],
      isCustom: true
    };
    addExercise(newEx);
    onAddExercise(newEx);
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name={Icons.x} size={20} color="#71717A" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
            placeholderTextColor="#52525B"
          />

          <ScrollView style={styles.exerciseList}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseItem}
                onPress={() => {
                  onAddExercise(exercise);
                  handleClose();
                }}
              >
                <View>
                  <Text style={styles.exerciseItemName}>{exercise.name}</Text>
                  <Text style={styles.exerciseItemMuscles}>{exercise.muscleGroups.join(' • ')}</Text>
                </View>
                <Icon name={Icons.plus} size={20} color="#F97316" />
              </TouchableOpacity>
            ))}
            
            {filteredExercises.length === 0 && searchQuery.length > 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Couldn't find "{searchQuery}"</Text>
                <TouchableOpacity 
                  style={styles.createBtn}
                  onPress={handleAddCustomExercise}
                >
                  <Icon name={Icons.plus} size={16} color="#F97316" />
                  <Text style={styles.createBtnText}>Create Custom Exercise</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerModal: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  searchInput: { backgroundColor: '#27272A', borderRadius: 12, padding: 12, color: '#fff', fontSize: 16, marginBottom: 16 },
  exerciseList: { flex: 1 },
  exerciseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  exerciseItemName: { fontSize: 16, color: '#fff', fontWeight: '500' },
  exerciseItemMuscles: { fontSize: 12, color: '#71717A', marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#71717A', marginBottom: 16 },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(249, 115, 22, 0.1)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F97316' },
  createBtnText: { color: '#F97316', fontWeight: '600' },
});
