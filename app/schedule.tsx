import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../components/Icon';
import { useWorkoutStore } from '../stores/workoutStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ScheduleItem {
  dayIndex: number;
  workoutId: string | null;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { workouts } = useWorkoutStore();
  const [schedule, setSchedule] = useState<ScheduleItem[]>(
    DAYS.map((_, i) => ({ dayIndex: i, workoutId: null }))
  );
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleSelectWorkout = (workoutId: string | null) => {
    if (selectedDay !== null) {
      setSchedule(prev => prev.map(item =>
        item.dayIndex === selectedDay ? { ...item, workoutId } : item
      ));
    }
    setShowPicker(false);
    setSelectedDay(null);
  };

  const handleDayPress = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setShowPicker(true);
  };

  const getWorkoutForDay = (dayIndex: number) => {
    const item = schedule.find(s => s.dayIndex === dayIndex);
    if (!item?.workoutId) return null;
    return workouts.find(w => w.id === item.workoutId);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name={Icons.x} size={24} color="#71717A" />
        </TouchableOpacity>
        <Text style={styles.title}>Weekly Schedule</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.weekGrid}>
          {DAYS.map((day, index) => {
            const workout = getWorkoutForDay(index);
            const isToday = new Date().getDay() - 1 === index;

            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCard, isToday && styles.dayCardToday]}
                onPress={() => handleDayPress(index)}
              >
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                {workout ? (
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName} numberOfLines={1}>{workout.name}</Text>
                    <Text style={styles.exerciseCount}>{workout.exercises.length} exercises</Text>
                  </View>
                ) : (
                  <View style={styles.emptyDay}>
                    <Icon name={Icons.plus} size={20} color="#3F3F46" />
                    <Text style={styles.emptyText}>Add workout</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <Text style={styles.tipText}>• Tap any day to assign a workout</Text>
          <Text style={styles.tipText}>• Clear a day by selecting "None"</Text>
          <Text style={styles.tipText}>• Rest days help muscle recovery</Text>
        </View>
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay !== null ? DAYS[selectedDay] : ''} - Select Workout
              </Text>
              <TouchableOpacity onPress={() => { setShowPicker(false); setSelectedDay(null); }}>
                <Icon name={Icons.x} size={20} color="#71717A" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleSelectWorkout(null)}
            >
              <Icon name={Icons.x} size={20} color="#EF4444" />
              <Text style={styles.optionText}>Rest Day (None)</Text>
            </TouchableOpacity>

            {workouts.map(workout => (
              <TouchableOpacity
                key={workout.id}
                style={styles.optionItem}
                onPress={() => handleSelectWorkout(workout.id)}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>{workout.name}</Text>
                  <Text style={styles.optionSubtext}>{workout.type} • {workout.exercises.length} exercises</Text>
                </View>
                <Icon name={Icons.chevronRight} size={20} color="#71717A" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  weekGrid: { gap: 12 },
  dayCard: { backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#27272A' },
  dayCardToday: { borderColor: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' },
  dayLabel: { fontSize: 14, color: '#71717A', fontWeight: '600', marginBottom: 8 },
  dayLabelToday: { color: '#F97316' },
  workoutInfo: { gap: 4 },
  workoutName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  exerciseCount: { fontSize: 13, color: '#71717A' },
  emptyDay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: '#52525B' },
  tips: { marginTop: 32, backgroundColor: '#18181B', borderRadius: 16, padding: 16 },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  tipText: { fontSize: 14, color: '#71717A', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerModal: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#27272A', gap: 12 },
  optionContent: { flex: 1 },
  optionText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  optionSubtext: { fontSize: 13, color: '#71717A', marginTop: 2 },
});