import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Image } from 'react-native';
import { useWorkoutStore } from '../../stores/workoutStore';
import { muscleGroups, equipmentTypes } from '../../data/mockData';
import { Icon, Icons } from '../../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../../types';
import { MuscleVisualization } from '../../components/MuscleVisualization';

const difficulties = ['beginner', 'intermediate', 'advanced'];
const equipmentList = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];
const categories = ['All', 'strength', 'cardio', 'flexibility'];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return '#22C55E';
    case 'intermediate': return '#F97316';
    case 'advanced': return '#EF4444';
    default: return '#71717A';
  }
};

const getEquipmentIcon = (equipment: string | null) => {
  switch (equipment?.toLowerCase()) {
    case 'barbell': return Icons.barbell;
    case 'dumbbell': return Icons.dumbbell;
    case 'cable': return Icons.cable;
    case 'machine': return Icons.machine;
    case 'bodyweight': return Icons.bodyweight;
    default: return Icons.dumbbell;
  }
};

const ExerciseCard = React.memo(({ 
  item, 
  isUsed, 
  isFavorite, 
  onPress, 
  onToggleFavorite 
}: { 
  item: Exercise; 
  isUsed: boolean; 
  isFavorite: boolean; 
  onPress: () => void; 
  onToggleFavorite: () => void; 
}) => {
  const hasDemo = !!item.demoUrl;

  return (
    <TouchableOpacity style={styles.exerciseCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleArea}>
          <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.badgeRow}>
            {hasDemo && (
              <View style={styles.demoBadge}>
                <Icon name={Icons.play} size={10} color="#A78BFA" />
                <Text style={styles.demoBadgeText}>Demo</Text>
              </View>
            )}
            {isUsed && (
              <View style={styles.usedBadge}>
                <Icon name={Icons.checkCircle} size={10} color="#22C55E" />
                <Text style={styles.usedBadgeText}>Used</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onToggleFavorite} style={styles.heartBtn}>
          <Icon name={isFavorite ? Icons.heartFilled : Icons.heart} size={20} color={isFavorite ? '#EF4444' : '#52525B'} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.metaInfo}>
          <View style={styles.metaBadge}>
            <Icon name={getEquipmentIcon(item.equipment)} size={12} color="#A1A1AA" />
            <Text style={styles.metaText}>{item.equipment}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Icon name={Icons.activity} size={12} color="#A1A1AA" />
            <Text style={styles.metaText}>{item.muscleGroups[0]}{item.muscleGroups.length > 1 ? ' +' : ''}</Text>
          </View>
          <View style={[styles.metaBadge, { borderColor: getDifficultyColor(item.difficulty) + '40', backgroundColor: getDifficultyColor(item.difficulty) + '10' }]}>
            <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(item.difficulty) }]} />
            <Text style={[styles.metaText, { color: getDifficultyColor(item.difficulty) }]}>{item.difficulty}</Text>
          </View>
        </View>
        
        <View style={styles.setsRepsBlock}>
          <Text style={styles.setsRepsText}>{item.defaultSets} <Text style={styles.setsRepsLabel}>sets</Text> × {item.defaultReps} <Text style={styles.setsRepsLabel}>reps</Text></Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function Exercises() {
  const { exercises, workouts, addExercise } = useWorkoutStore();
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [newExercise, setNewExercise] = useState({ name: '', muscleGroups: '', equipment: 'barbell', difficulty: 'beginner' });

  // Get exercises used in workouts
   const usedExerciseIds = useMemo(() => {
     const ids = new Set<string>();
     workouts.forEach((w: { exercises: Array<{ exerciseId?: string }> }) => {
       w.exercises.forEach((ex: { exerciseId?: string }) => {
         if (ex.exerciseId) ids.add(ex.exerciseId);
       });
     });
     return ids;
   }, [workouts]);

  // Recent exercises (most recently used)
  const recentExercises = useMemo(() => {
    const sorted = [...exercises].sort((a, b) => {
      const aUsed = usedExerciseIds.has(a.id);
      const bUsed = usedExerciseIds.has(b.id);
      if (aUsed && !bUsed) return -1;
      if (!aUsed && bUsed) return 1;
      return 0;
    });
    return sorted.slice(0, 5);
  }, [exercises, usedExerciseIds]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

   const filteredExercises = useMemo(() => {
     return exercises.filter((e: Exercise) => {
       const matchesQuery = e.name.toLowerCase().includes(searchQuery.toLowerCase());
       const matchesMuscle = selectedMuscle === 'All' || e.muscleGroups.some((m: string) => m.toLowerCase() === selectedMuscle.toLowerCase());
       const matchesEquipment = !selectedEquipment || e.equipment === selectedEquipment;
       const matchesDifficulty = !selectedDifficulty || e.difficulty === selectedDifficulty;
       const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
       return matchesQuery && matchesMuscle && matchesEquipment && matchesDifficulty && matchesCategory;
     });
   }, [exercises, searchQuery, selectedMuscle, selectedEquipment, selectedDifficulty, selectedCategory]);

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

  const showExerciseDetails = useCallback((exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailsModal(true);
  }, []);

  const renderExerciseItem = useCallback(({ item }: { item: Exercise }) => {
    return (
      <ExerciseCard
        item={item}
        isUsed={usedExerciseIds.has(item.id)}
        isFavorite={favorites.has(item.id)}
        onPress={() => showExerciseDetails(item)}
        onToggleFavorite={() => toggleFavorite(item.id)}
      />
    );
  }, [usedExerciseIds, favorites, showExerciseDetails, toggleFavorite]);

  const activeFiltersCount = (selectedEquipment ? 1 : 0) + (selectedDifficulty ? 1 : 0) + (selectedCategory !== 'All' ? 1 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Exercises</Text>
          <Text style={styles.subtitle}>{exercises.length} movements</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <LinearGradient colors={['#F97316', '#EA580C']} style={StyleSheet.absoluteFill} />
          <Icon name={Icons.plus} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search & Filter Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon name={Icons.search} size={18} color="#71717A" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search exercises..." 
            placeholderTextColor="#52525B" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Icon name={Icons.x} size={14} color="#A1A1AA" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]} onPress={() => setShowFiltersModal(true)}>
          <Icon name={Icons.settings} size={20} color={activeFiltersCount > 0 ? '#F97316' : '#A1A1AA'} />
          {activeFiltersCount > 0 && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Horizontal Muscle Groups */}
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleList}>
          {muscleGroups.map((item) => (
            <TouchableOpacity key={item} style={[styles.filterChip, selectedMuscle === item && styles.filterChipActive]} onPress={() => setSelectedMuscle(item)}>
              <Text style={[styles.filterChipText, selectedMuscle === item && styles.filterChipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          usedExerciseIds.size > 0 && searchQuery === '' && selectedMuscle === 'All' ? (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Jump Back In</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList}>
                {recentExercises.map(ex => (
                  <TouchableOpacity key={ex.id} style={styles.recentPill} onPress={() => showExerciseDetails(ex)}>
                    <Text style={styles.recentPillText}>{ex.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconLarge}>
              <Icon name={Icons.search} size={32} color="#3F3F46" />
            </View>
            <Text style={styles.emptyTitle}>No exercises found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search or filters</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity style={styles.emptyActionBtn} onPress={() => { setSearchQuery(''); setSelectedMuscle('All'); setSelectedEquipment(null); setSelectedDifficulty(null); setSelectedCategory('All'); }}>
                <Text style={styles.emptyActionText}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyActionBtnPrimary} onPress={() => setShowAddModal(true)}>
                <Icon name={Icons.plus} size={16} color="#fff" />
                <Text style={styles.emptyActionTextPrimary}>Add Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={renderExerciseItem}
      />

      {/* Advanced Filters Modal */}
      <Modal visible={showFiltersModal} transparent animationType="slide">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowFiltersModal(false)}>
          <View style={styles.filtersModalContent}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}><Icon name={Icons.x} size={24} color="#A1A1AA" /></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterSectionTitle}>Equipment</Text>
              <View style={styles.filterWrapRow}>
                <TouchableOpacity style={[styles.filterOption, !selectedEquipment && styles.filterOptionActive]} onPress={() => setSelectedEquipment(null)}>
                  <Text style={[styles.filterOptionText, !selectedEquipment && styles.filterOptionTextActive]}>Any</Text>
                </TouchableOpacity>
                {equipmentList.map(eq => (
                  <TouchableOpacity key={eq} style={[styles.filterOption, selectedEquipment === eq && styles.filterOptionActive]} onPress={() => setSelectedEquipment(eq)}>
                    <Text style={[styles.filterOptionText, selectedEquipment === eq && styles.filterOptionTextActive]}>{eq}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterWrapRow}>
                {categories.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.filterOption, selectedCategory === cat && styles.filterOptionActive]} onPress={() => setSelectedCategory(cat)}>
                    <Text style={[styles.filterOptionText, selectedCategory === cat && styles.filterOptionTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterSectionTitle}>Difficulty</Text>
              <View style={styles.filterWrapRow}>
                <TouchableOpacity style={[styles.filterOption, !selectedDifficulty && styles.filterOptionActive]} onPress={() => setSelectedDifficulty(null)}>
                  <Text style={[styles.filterOptionText, !selectedDifficulty && styles.filterOptionTextActive]}>Any</Text>
                </TouchableOpacity>
                {difficulties.map(d => (
                  <TouchableOpacity key={d} style={[styles.filterOption, selectedDifficulty === d && styles.filterOptionActive]} onPress={() => setSelectedDifficulty(d)}>
                    <Text style={[styles.filterOptionText, selectedDifficulty === d && styles.filterOptionTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.filtersFooter}>
              <TouchableOpacity 
                style={styles.resetBtn} 
                onPress={() => { setSelectedEquipment(null); setSelectedCategory('All'); setSelectedDifficulty(null); setShowFiltersModal(false); }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFiltersModal(false)}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
              {equipmentList.map(eq => (
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
              {selectedExercise.demoUrl && (
                <TouchableOpacity style={styles.demoPreview} onPress={() => setShowDemoModal(true)}>
                  <Image source={{ uri: selectedExercise.demoUrl }} style={styles.demoImage} resizeMode="cover" />
                  <View style={styles.demoOverlay}>
                    <View style={styles.playButton}>
                      <Icon name={Icons.play} size={32} color="#fff" />
                    </View>
                    <Text style={styles.demoText}>Tap to view demo</Text>
                  </View>
                </TouchableOpacity>
              )}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Muscle Groups</Text>
                <View style={styles.tagRow}>
                  {selectedExercise.muscleGroups.map(m => <View key={m} style={styles.detailTag}><Text style={styles.detailTagText}>{m}</Text></View>)}
                </View>
                <MuscleVisualization muscleGroups={selectedExercise.muscleGroups} />
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Equipment</Text>
                <Text style={styles.detailValue}>{selectedExercise.equipment}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Difficulty</Text>
                <Text style={[styles.detailValue, { color: getDifficultyColor(selectedExercise.difficulty) }]}>{selectedExercise.difficulty}</Text>
              </View>
              {selectedExercise.category && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <View style={styles.tagRow}>
                    <View style={[styles.detailTag, { backgroundColor: '#8B5CF620' }]}>
                      <Text style={[styles.detailTagText, { color: '#8B5CF6' }]}>{selectedExercise.category}</Text>
                    </View>
                  </View>
                </View>
              )}
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

      {/* Demo Viewer Modal */}
      <Modal visible={showDemoModal} transparent animationType="fade">
        <TouchableOpacity style={styles.demoModalOverlay} activeOpacity={1} onPress={() => setShowDemoModal(false)}>
          <View style={styles.demoModalContent}>
            <TouchableOpacity style={styles.demoModalClose} onPress={() => setShowDemoModal(false)}>
              <Icon name={Icons.x} size={24} color="#fff" />
            </TouchableOpacity>
            {selectedExercise?.demoUrl && (
              <Image source={{ uri: selectedExercise.demoUrl }} style={styles.demoFullImage} resizeMode="contain" />
            )}
            <Text style={styles.demoModalTitle}>{selectedExercise?.name}</Text>
            <Text style={styles.demoModalSubtitle}>Demonstration</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#71717A', marginTop: 4 },
  addButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  
  // Search & Filter Row
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', gap: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#fff', fontSize: 16 },
  clearBtn: { padding: 4 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#18181B', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center' },
  filterBtnActive: { borderColor: 'rgba(249, 115, 22, 0.3)', backgroundColor: 'rgba(249, 115, 22, 0.05)' },
  filterBadge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316', borderWidth: 1, borderColor: '#18181B' },
  
  // Muscle Filters
  filtersRow: { marginBottom: 16 },
  muscleList: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#18181B', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', minWidth: 60, alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterChipText: { fontSize: 13, color: '#A1A1AA', fontWeight: '500' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  
  // List
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  recentSection: { marginBottom: 24 },
  recentTitle: { fontSize: 13, color: '#71717A', marginBottom: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  recentList: { gap: 10 },
  recentPill: { backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.02)' },
  recentPillText: { fontSize: 13, color: '#E4E4E7', fontWeight: '500' },
  
  // Exercise Card (Premium)
  exerciseCard: { backgroundColor: '#18181B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.03)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitleArea: { flex: 1, paddingRight: 16 },
  exerciseName: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  demoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(167, 139, 250, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.2)' },
  demoBadgeText: { fontSize: 10, color: '#A78BFA', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  usedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
  usedBadgeText: { fontSize: 10, color: '#22C55E', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heartBtn: { padding: 4 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  metaInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 255, 255, 0.03)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.02)' },
  metaText: { fontSize: 12, color: '#A1A1AA', textTransform: 'capitalize', fontWeight: '500' },
  difficultyDot: { width: 6, height: 6, borderRadius: 3 },
  
  setsRepsBlock: { backgroundColor: 'rgba(249, 115, 22, 0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.15)' },
  setsRepsText: { fontSize: 13, fontWeight: '700', color: '#F97316' },
  setsRepsLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(249, 115, 22, 0.7)' },
  
  // Empty State
  emptyStateContainer: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyIconLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#71717A', marginBottom: 24, textAlign: 'center' },
  emptyActions: { flexDirection: 'row', gap: 12 },
  emptyActionBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' },
  emptyActionText: { fontSize: 14, color: '#A1A1AA', fontWeight: '500' },
  emptyActionBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: '#F97316' },
  emptyActionTextPrimary: { fontSize: 14, color: '#fff', fontWeight: '600' },
  
  // Filter Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  filtersModalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', borderBottomWidth: 0 },
  filtersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  filtersTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  filterSectionTitle: { fontSize: 14, fontWeight: '600', color: '#71717A', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterWrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  filterOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.02)' },
  filterOptionActive: { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.3)' },
  filterOptionText: { fontSize: 14, color: '#A1A1AA', textTransform: 'capitalize', fontWeight: '500' },
  filterOptionTextActive: { color: '#F97316', fontWeight: '600' },
  filtersFooter: { flexDirection: 'row', gap: 12, marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  resetBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center' },
  resetBtnText: { fontSize: 16, color: '#E4E4E7', fontWeight: '600' },
  applyBtn: { flex: 2, paddingVertical: 16, borderRadius: 16, backgroundColor: '#F97316', alignItems: 'center' },
  applyBtnText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  
  // Existing Modals
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
  demoPreview: { height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 20, backgroundColor: '#18181B' },
  demoImage: { width: '100%', height: '100%' },
  demoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  demoText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  demoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  demoModalContent: { width: '90%', maxHeight: '80%', alignItems: 'center' },
  demoModalClose: { position: 'absolute', top: -40, right: 0, zIndex: 10, padding: 8 },
  demoFullImage: { width: '100%', height: 300, borderRadius: 12 },
  demoModalTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16 },
  demoModalSubtitle: { fontSize: 14, color: '#71717A', marginTop: 4 },
});