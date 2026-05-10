import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useWorkoutStore } from '../../stores/workoutStore';
import { muscleGroups, equipmentTypes } from '../../data/mockData';
import { Icon, Icons } from '../../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../../types';

const difficulties = ['beginner', 'intermediate', 'advanced'];

export default function Exercises() {
  const { exercises, addExercise } = useWorkoutStore();
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [newExercise, setNewExercise] = useState({ name: '', muscleGroups: '', equipment: 'barbell', difficulty: 'beginner' });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const filteredExercises = useMemo(() => {
    return exercises.filter(e => {
      const matchesQuery = e.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = selectedMuscle === 'All' || e.muscleGroups.some(m => m.toLowerCase() === selectedMuscle.toLowerCase());
      const matchesEquipment = !selectedEquipment || e.equipment === selectedEquipment;
      const matchesDifficulty = !selectedDifficulty || e.difficulty === selectedDifficulty;
      return matchesQuery && matchesMuscle && matchesEquipment && matchesDifficulty;
    });
  }, [exercises, searchQuery, selectedMuscle, selectedEquipment, selectedDifficulty]);

  const handleAddExercise = () => {
    if (!newExercise.name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      muscleGroups: newExercise.muscleGroups.split(',').map(m => m.trim()).filter(Boolean),
      equipment: newExercise.equipment,
      difficulty: newExercise.difficulty as any,
      defaultSets: 3,
      defaultReps: 10,
      coachingCues: [],
      isCustom: true,
    };
    addExercise(exercise);
    setShowAddModal(false);
    setNewExercise({ name: '', muscleGroups: '', equipment: 'barbell', difficulty: 'beginner' });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22C55E';
      case 'intermediate': return '#F97316';
      case 'advanced': return '#EF4444';
      default: return '#71717A';
    }
  };

  const showExerciseDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailsModal(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Text style={styles.title}>Exercises</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <LinearGradient colors={['#F97316', '#EA580C']} style={StyleSheet.absoluteFill} />
          <Icon name={Icons.plus} size={24} color="#0D0D0D" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name={Icons.search} size={18} color="#71717A" />
        <TextInput style={styles.searchInput} placeholder="Search exercises..." placeholderTextColor="#52525B" value={searchQuery} onChangeText={setSearchQuery} />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}><Icon name={Icons.x} size={16} color="#71717A" /></TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleList}>
          {muscleGroups.map((item) => (
            <TouchableOpacity key={item} style={[styles.filterChip, selectedMuscle === item && styles.filterChipActive]} onPress={() => setSelectedMuscle(item)}>
              <Text style={[styles.filterChipText, selectedMuscle === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterTags}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={[styles.filterTag, selectedEquipment && styles.filterTagActive]} onPress={() => setSelectedEquipment(selectedEquipment === null ? 'barbell' : selectedEquipment === 'barbell' ? 'dumbbell' : selectedEquipment === 'dumbbell' ? 'cable' : selectedEquipment === 'cable' ? 'machine' : selectedEquipment === 'machine' ? 'bodyweight' : null)}>
            <Icon name={Icons.dumbbell} size={12} color={selectedEquipment ? '#fff' : '#71717A'} />
            <Text style={[styles.filterTagText, selectedEquipment && styles.filterTagTextActive]}>{selectedEquipment || 'Equipment'}</Text>
          </TouchableOpacity>
          {difficulties.map(d => (
            <TouchableOpacity key={d} style={[styles.filterTag, selectedDifficulty === d && styles.filterTagActive]} onPress={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}>
              <Text style={[styles.filterTagText, selectedDifficulty === d && styles.filterTagTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
          {(selectedEquipment || selectedDifficulty) && (
            <TouchableOpacity style={styles.clearFilter} onPress={() => { setSelectedEquipment(null); setSelectedDifficulty(null); }}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No exercises found</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.exerciseCard} onPress={() => showExerciseDetails(item)}>
            <View style={styles.exerciseMain}>
              <View style={styles.exerciseNameRow}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Icon name={favorites.has(item.id) ? Icons.heartFilled : Icons.heart} size={20} color={favorites.has(item.id) ? '#EF4444' : '#52525B'} />
                </TouchableOpacity>
              </View>
              <View style={styles.exerciseMeta}>
                <Text style={styles.equipment}>{item.equipment}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.muscleTarget}>{item.muscleGroups.join(', ')}</Text>
              </View>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>{item.difficulty}</Text>
              </View>
            </View>
            <View style={styles.exerciseDetails}>
              <View style={styles.setsReps}><Text style={styles.setsRepsValue}>{item.defaultSets}</Text><Text style={styles.setsRepsLabel}>sets</Text></View>
              <View style={styles.setsReps}><Text style={styles.setsRepsValue}>{item.defaultReps}</Text><Text style={styles.setsRepsLabel}>reps</Text></View>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}><Icon name={Icons.x} size={24} color="#fff" /></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TouchableOpacity onPress={handleAddExercise}><Text style={styles.saveButton}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} placeholder="Exercise name" placeholderTextColor="#52525B" value={newExercise.name} onChangeText={(t) => setNewExercise({ ...newExercise, name: t })} />
            <Text style={styles.inputLabel}>Muscle Groups</Text>
            <TextInput style={styles.input} placeholder="chest, triceps, shoulders" placeholderTextColor="#52525B" value={newExercise.muscleGroups} onChangeText={(t) => setNewExercise({ ...newExercise, muscleGroups: t })} />
            <Text style={styles.inputLabel}>Equipment</Text>
            <View style={styles.optionRow}>
              {['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'].map(eq => (
                <TouchableOpacity key={eq} style={[styles.optionChip, newExercise.equipment === eq && styles.optionChipActive]} onPress={() => setNewExercise({ ...newExercise, equipment: eq })}>
                  <Text style={[styles.optionChipText, newExercise.equipment === eq && styles.optionChipTextActive]}>{eq}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Difficulty</Text>
            <View style={styles.optionRow}>
              {difficulties.map(d => (
                <TouchableOpacity key={d} style={[styles.optionChip, newExercise.difficulty === d && styles.optionChipActive]} onPress={() => setNewExercise({ ...newExercise, difficulty: d })}>
                  <Text style={[styles.optionChipText, newExercise.difficulty === d && styles.optionChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showDetailsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}><Icon name={Icons.x} size={24} color="#fff" /></TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
            <View style={{ width: 40 }} />
          </View>
          {selectedExercise && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Muscle Groups</Text>
                <View style={styles.tagRow}>
                  {selectedExercise.muscleGroups.map(m => <View key={m} style={styles.detailTag}><Text style={styles.detailTagText}>{m}</Text></View>)}
                </View>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Equipment</Text>
                <Text style={styles.detailValue}>{selectedExercise.equipment}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Difficulty</Text>
                <Text style={[styles.detailValue, { color: getDifficultyColor(selectedExercise.difficulty) }]}>{selectedExercise.difficulty}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Default</Text>
                <Text style={styles.detailValue}>{selectedExercise.defaultSets} sets × {selectedExercise.defaultReps} reps</Text>
              </View>
              {selectedExercise.coachingCues.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Coaching Cues</Text>
                  {selectedExercise.coachingCues.map((cue, i) => (
                    <View key={i} style={styles.cueRow}><View style={styles.cueDot} /><Text style={styles.cueText}>{cue}</Text></View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  addButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#27272A', gap: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#fff', fontSize: 16 },
  filterTags: { paddingHorizontal: 20, paddingVertical: 8 },
  filterTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#18181B', marginRight: 8, gap: 4, borderWidth: 1, borderColor: '#27272A' },
  filterTagActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterTagText: { fontSize: 12, color: '#71717A' },
  filterTagTextActive: { color: '#fff' },
  clearFilter: { paddingHorizontal: 12, paddingVertical: 6 },
  clearFilterText: { fontSize: 12, color: '#EF4444' },
  muscleList: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', marginRight: 8, minWidth: 60, alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterChipText: { fontSize: 14, color: '#71717A', fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  exerciseCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  exerciseMain: { flex: 1 },
  exerciseNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  exerciseMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  equipment: { fontSize: 13, color: '#71717A', textTransform: 'capitalize' },
  dot: { color: '#3F3F46', marginHorizontal: 6, fontSize: 13 },
  muscleTarget: { fontSize: 13, color: '#F97316', textTransform: 'capitalize' },
  difficultyBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  difficultyText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  exerciseDetails: { flexDirection: 'row', gap: 16, marginLeft: 12 },
  setsReps: { alignItems: 'center', minWidth: 35 },
  setsRepsValue: { fontSize: 18, fontWeight: '700', color: '#F97316' },
  setsRepsLabel: { fontSize: 11, color: '#71717A' },
  emptyText: { fontSize: 14, color: '#71717A', textAlign: 'center', padding: 40 },
  modalContainer: { flex: 1, backgroundColor: '#0D0D0D' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  saveButton: { fontSize: 16, color: '#F97316', fontWeight: '600' },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#71717A', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#18181B', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' },
  optionChipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  optionChipText: { fontSize: 14, color: '#71717A' },
  optionChipTextActive: { color: '#fff' },
  detailSection: { marginBottom: 24 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#71717A', marginBottom: 8, textTransform: 'uppercase' },
  detailValue: { fontSize: 18, color: '#fff', textTransform: 'capitalize' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailTag: { backgroundColor: '#F9731620', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  detailTagText: { fontSize: 14, color: '#F97316', textTransform: 'capitalize' },
  cueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  cueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316' },
  cueText: { fontSize: 14, color: '#fff' },
});