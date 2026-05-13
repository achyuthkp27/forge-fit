import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../components/Icon';
import { useWorkoutStore } from '../stores/workoutStore';
import { WeeklyScheduleItem } from '../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const REST_TIPS = [
  'Active recovery: Light walk or stretching',
  'Stay hydrated - aim for 3L water today',
  'Get 7-9 hours of quality sleep',
  'Focus on protein-rich meals for recovery',
  'Light mobility work keeps you loose',
  'Foam rolling helps reduce soreness',
];

// Convert store's WeeklyScheduleItem to local ScheduleItem
const toScheduleItem = (weekly: WeeklyScheduleItem, dayIndex: number): any => ({
  dayIndex,
  workoutId: weekly.workoutId || null,
  isCompleted: false,
});

// Convert local ScheduleItem to store's WeeklyScheduleItem
const toWeeklyScheduleItem = (item: any): WeeklyScheduleItem => ({
  day: DAYS[item.dayIndex],
  workoutId: item.workoutId || undefined,
  workoutName: item.workoutId || undefined,
});

export default function ScheduleScreen() {
  const router = useRouter();
  const { workouts, weeklySchedule, loadWeeklySchedule, updateScheduleItem } = useWorkoutStore();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<any[]>(
    weeklySchedule.length > 0 ? weeklySchedule.map((w, i) => toScheduleItem(w, i)) : DAYS.map((_, i) => ({ dayIndex: i, workoutId: null, isCompleted: false }))
  );
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    loadWeeklySchedule();
  }, []);

  useEffect(() => {
    if (weeklySchedule.length > 0) {
      setSchedule(weeklySchedule.map((w, i) => toScheduleItem(w, i)));
    }
  }, [weeklySchedule]);

  const weekDates = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (today.getDay() - 1) + (currentWeekOffset * 7));
    return DAYS.map((_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return { day: _, date, dayNum: date.getDate() };
    });
  }, [currentWeekOffset]);

  const handleSelectWorkout = async (workoutId: string | null) => {
    if (selectedDay !== null) {
      const newItem = { dayIndex: selectedDay, workoutId, isCompleted: false };
      setSchedule(prev => prev.map(item =>
        item.dayIndex === selectedDay ? newItem : item
      ));
      await updateScheduleItem(toWeeklyScheduleItem(newItem));
    }
    setShowPicker(false);
    setSelectedDay(null);
  };

  const handleDayPress = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setShowPicker(true);
  };

  const toggleCompletion = async (dayIndex: number) => {
    const item = schedule.find(s => s.dayIndex === dayIndex);
    if (!item) return;
    const updatedItem = { ...item, isCompleted: !item.isCompleted };
    setSchedule(prev => prev.map(s =>
      s.dayIndex === dayIndex ? updatedItem : s
    ));
    await updateScheduleItem(toWeeklyScheduleItem(updatedItem));
  };

  const getWorkoutForDay = (dayIndex: number) => {
    const item = schedule.find(s => s.dayIndex === dayIndex);
    if (!item?.workoutId) return null;
    return workouts.find(w => w.id === item.workoutId);
  };

  const isRestDay = (dayIndex: number) => {
    const item = schedule.find(s => s.dayIndex === dayIndex);
    return !item?.workoutId;
  };

  const getRestTip = (dayIndex: number) => {
    return REST_TIPS[dayIndex % REST_TIPS.length];
  };

  const isCurrentWeek = currentWeekOffset === 0;
  const isFutureWeek = currentWeekOffset > 0;

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

      <View style={styles.weekNav}>
        <TouchableOpacity style={styles.weekNavBtn} onPress={() => setCurrentWeekOffset(prev => prev - 1)}>
          <Icon name={Icons.chevronLeft} size={20} color="#71717A" />
        </TouchableOpacity>
        <View style={styles.weekLabelContainer}>
          <Text style={styles.weekLabel}>
            {weekDates[0].date.toLocaleString('default', { month: 'short' })} {weekDates[0].dayNum} - {weekDates[6].date.toLocaleString('default', { month: 'short' })} {weekDates[6].dayNum}
          </Text>
          {isCurrentWeek && <Text style={styles.currentWeekBadge}>This Week</Text>}
          {isFutureWeek && <Text style={styles.futureWeekBadge}>Upcoming</Text>}
        </View>
        <TouchableOpacity style={styles.weekNavBtn} onPress={() => setCurrentWeekOffset(prev => prev + 1)} disabled={currentWeekOffset === 0}>
          <Icon name={Icons.chevronRight} size={20} color={currentWeekOffset === 0 ? '#3F3F46' : '#71717A'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.weekGrid}>
          {DAYS.map((day, index) => {
            const workout = getWorkoutForDay(index);
            const isToday = isCurrentWeek && new Date().getDay() - 1 === index;
            const restTip = isRestDay(index) ? getRestTip(index) : null;
            const item = schedule.find(s => s.dayIndex === index);

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCard,
                  isToday && styles.dayCardToday,
                  isRestDay(index) && styles.dayCardRest
                ]}
                onPress={() => handleDayPress(index)}
              >
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                    <Text style={styles.dayDate}>{weekDates[index].dayNum}</Text>
                  </View>
                  {workout && (
                    <TouchableOpacity
                      style={[styles.completeBtn, item?.isCompleted && styles.completeBtnActive]}
                      onPress={() => toggleCompletion(index)}
                    >
                      <Icon
                        name={item?.isCompleted ? Icons.checkCircle : Icons.circle}
                        size={24}
                        color={item?.isCompleted ? '#22C55E' : '#3F3F46'}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {workout ? (
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName} numberOfLines={1}>{workout.name}</Text>
                    <Text style={styles.exerciseCount}>{workout.exercises.length} exercises</Text>
                  </View>
                ) : (
                  <View style={styles.restDayContainer}>
                    <Icon name={Icons.moon} size={24} color="#52525B" />
                    <Text style={styles.restLabel}>Rest Day</Text>
                    {restTip && <Text style={styles.restTip}>{restTip}</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <Text style={styles.tipText}>• Tap any day to assign a workout</Text>
          <Text style={styles.tipText}>• Tap the checkmark to mark workouts as done</Text>
          <Text style={styles.tipText}>• Rest days help muscle recovery</Text>
        </View>
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  weekNavBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center' },
  weekLabelContainer: { alignItems: 'center' },
  weekLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
  currentWeekBadge: { fontSize: 11, color: '#F97316', marginTop: 4 },
  futureWeekBadge: { fontSize: 11, color: '#22C55E', marginTop: 4 },
  content: { flex: 1, paddingHorizontal: 20 },
  weekGrid: { gap: 12 },
  dayCard: { backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#27272A' },
  dayCardToday: { borderColor: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.1)' },
  dayCardRest: { backgroundColor: '#18181B', borderStyle: 'dashed', borderColor: '#3F3F46' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  dayLabel: { fontSize: 14, color: '#71717A', fontWeight: '600' },
  dayLabelToday: { color: '#F97316' },
  dayDate: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 2 },
  completeBtn: { padding: 4 },
  completeBtnActive: {},
  workoutInfo: { gap: 4 },
  workoutName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  exerciseCount: { fontSize: 13, color: '#71717A' },
  emptyDay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: '#52525B' },
  restDayContainer: { alignItems: 'center', paddingVertical: 8 },
  restLabel: { fontSize: 14, color: '#52525B', marginTop: 4 },
  restTip: { fontSize: 12, color: '#71717A', marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  tips: { marginTop: 32, backgroundColor: '#18181B', borderRadius: 16, padding: 16 },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  tipText: { fontSize: 14, color: '#71717A', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerModal: { backgroundColor: 'transparent', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#27272A', gap: 12 },
  optionContent: { flex: 1 },
  optionText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  optionSubtext: { fontSize: 13, color: '#71717A', marginTop: 2 },
});