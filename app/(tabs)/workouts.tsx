import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../../components/Icon';
import { useWorkoutStore } from '../../stores/workoutStore';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Workouts() {
  const router = useRouter();
  const { workouts, sessions, startSession, suggestedWorkout } = useWorkoutStore();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string | null>>({
    Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null, Sun: null,
  });

  const getLastSession = (workoutId: string) => {
    const workoutSessions = sessions.filter(s => s.workoutId === workoutId);
    return workoutSessions.length > 0 ? workoutSessions[workoutSessions.length - 1] : null;
  };

  const handleStartWorkout = async (workout: any) => {
    await startSession(workout);
    router.push('/workout');
  };

  const handleCreateNew = () => {
    router.push('/workout-builder');
  };

  const getScheduledWorkout = (day: string) => {
    const workoutId = weeklySchedule[day];
    return workoutId ? workouts.find(w => w.id === workoutId) : null;
  };

  const assignWorkoutToDay = (day: string, workoutId: string | null) => {
    setWeeklySchedule(prev => ({ ...prev, [day]: workoutId }));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <TouchableOpacity style={styles.scheduleButton} onPress={() => setShowScheduleModal(true)}>
            <Icon name={Icons.calendar} size={20} color="#F97316" />
            <Text style={styles.scheduleButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {suggestedWorkout && (
          <TouchableOpacity style={styles.aiCard} onPress={handleCreateNew}>
            <LinearGradient colors={['#F97316', '#EA580C']} style={StyleSheet.absoluteFill} />
            <View style={styles.aiCardContent}>
              <Icon name={Icons.sparkles} size={24} color="#fff" />
              <View style={styles.aiCardText}>
                <Text style={styles.aiTitle}>AI Suggested: {suggestedWorkout.name}</Text>
                <Text style={styles.aiSubtitle}>{suggestedWorkout.exercises.length} exercises</Text>
              </View>
              <Icon name={Icons.chevronRight} size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day, index) => {
              const workout = getScheduledWorkout(day);
              const isToday = new Date().getDay() === index + 1;
              return (
                <TouchableOpacity key={day} style={[styles.dayColumn, isToday && styles.dayColumnToday]} onPress={() => setShowScheduleModal(true)}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
                  {workout ? (
                    <View style={[styles.dayWorkout, isToday && styles.dayWorkoutToday]}>
                      <Text style={styles.dayWorkoutText} numberOfLines={1}>{workout.name}</Text>
                    </View>
                  ) : (
                    <View style={styles.dayEmpty}><Text style={styles.dayEmptyText}>+</Text></View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Workouts ({workouts.length})</Text>
          {workouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name={Icons.dumbbell} size={48} color="#3F3F46" />
              <Text style={styles.emptyTitle}>No Workouts Yet</Text>
              <Text style={styles.emptyDesc}>Create your first workout to get started</Text>
            </View>
          ) : (
            workouts.map((workout) => {
              const lastSession = getLastSession(workout.id);
              const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24)) : null;
              return (
                <View key={workout.id} style={styles.workoutCard}>
                  <TouchableOpacity style={styles.workoutContent} onPress={() => handleStartWorkout(workout)}>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                      <View style={styles.workoutMeta}>
                        <View style={[styles.typeBadge, workout.type === 'gym' ? styles.gymBadge : styles.homeBadge]}>
                          <Icon name={workout.type === 'gym' ? Icons.dumbbell : Icons.home} size={12} color={workout.type === 'gym' ? '#F97316' : '#22C55E'} />
                          <Text style={[styles.typeText, workout.type === 'gym' ? styles.gymText : styles.homeText]}>{workout.type}</Text>
                        </View>
                        <Text style={styles.exerciseCount}>{workout.exercises.length} exercises</Text>
                      </View>
                      {lastSession && (
                        <Text style={styles.lastSession}>
                          {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                        </Text>
                      )}
                    </View>
                    <View style={styles.startButton}>
                      <Icon name={Icons.play} size={20} color="#F97316" />
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <LinearGradient colors={['#F97316', '#EA580C']} style={StyleSheet.absoluteFill} />
        <Icon name={Icons.plus} size={28} color="#0D0D0D" />
      </TouchableOpacity>

      <Modal visible={showScheduleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly Schedule</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Icon name={Icons.x} size={24} color="#71717A" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {WEEKDAYS.map((day) => (
                <View key={day} style={styles.scheduleRow}>
                  <View style={styles.scheduleDay}>
                    <Text style={styles.scheduleDayText}>{day}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.scheduleWorkoutBtn, weeklySchedule[day] && styles.scheduleWorkoutBtnActive]}
                    onPress={() => {}}
                  >
                    <Text style={[styles.scheduleWorkoutBtnText, weeklySchedule[day] && styles.scheduleWorkoutBtnTextActive]}>
                      {getScheduledWorkout(day)?.name || 'Tap to assign'}
                    </Text>
                    <Icon name={Icons.chevronRight} size={16} color="#52525B" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  scheduleButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#18181B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#27272A' },
  scheduleButtonText: { fontSize: 14, color: '#F97316', fontWeight: '500' },
  aiCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  aiCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  aiCardText: { flex: 1 },
  aiTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  aiSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#71717A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#18181B', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#27272A' },
  dayColumn: { alignItems: 'center', flex: 1 },
  dayColumnToday: {},
  dayLabel: { fontSize: 11, color: '#71717A', marginBottom: 8, fontWeight: '600' },
  dayLabelToday: { color: '#F97316' },
  dayWorkout: { backgroundColor: '#27272A', paddingHorizontal: 6, paddingVertical: 8, borderRadius: 8, width: '100%', minHeight: 32, justifyContent: 'center', alignItems: 'center' },
  dayWorkoutToday: { backgroundColor: '#F97316' },
  dayWorkoutText: { fontSize: 10, color: '#fff', fontWeight: '600', textAlign: 'center' },
  dayEmpty: { width: '100%', minHeight: 32, justifyContent: 'center', alignItems: 'center' },
  dayEmptyText: { fontSize: 16, color: '#3F3F46' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#71717A', marginTop: 8 },
  workoutCard: { backgroundColor: '#18181B', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#27272A' },
  workoutContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  workoutMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  gymBadge: { backgroundColor: 'rgba(249, 115, 22, 0.2)' },
  homeBadge: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  typeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  gymText: { color: '#F97316' },
  homeText: { color: '#22C55E' },
  exerciseCount: { fontSize: 13, color: '#71717A' },
  lastSession: { fontSize: 12, color: '#52525B', marginTop: 4 },
  startButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(249, 115, 22, 0.2)', justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  scheduleDay: { width: 60 },
  scheduleDayText: { fontSize: 14, color: '#71717A' },
  scheduleWorkoutBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272A', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  scheduleWorkoutBtnActive: { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 1, borderColor: '#F97316' },
  scheduleWorkoutBtnText: { fontSize: 14, color: '#71717A' },
  scheduleWorkoutBtnTextActive: { color: '#F97316', fontWeight: '500' },
});