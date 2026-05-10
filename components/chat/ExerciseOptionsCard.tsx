import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput } from 'react-native';
import { useWorkoutStore } from '../../stores/workoutStore';
import { Icon, Icons } from '../Icon';

interface Props {
  onSelectExercise: (exerciseId: string) => void;
  onCancel: () => void;
}

export function ExerciseOptionsCard({ onSelectExercise, onCancel }: Props) {
  const { exercises } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Swap Exercise</Text>
        <TouchableOpacity onPress={onCancel}>
          <Icon name={Icons.x} size={20} color="#71717A" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises..."
        placeholderTextColor="#52525B"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseItem}
            onPress={() => onSelectExercise(item.id)}
          >
            <View>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMuscles}>{item.muscleGroups.join(', ')}</Text>
            </View>
            <Icon name={Icons.chevronRight} size={16} color="#71717A" />
          </TouchableOpacity>
        )}
        style={styles.list}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  searchInput: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  list: {
    maxHeight: 250,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  exerciseName: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  exerciseMuscles: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
});