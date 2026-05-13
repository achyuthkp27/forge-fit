import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert, Share, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../components/Icon';
import { useWorkoutStore } from '../stores/workoutStore';
import { getAllSessions, getSessionSets, deleteSession as dbDeleteSession } from '../lib/db';

interface SessionDetail {
  id: string;
  workoutId: string;
  workoutName: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  sets: any[];
}

export default function HistoryScreen() {
  const router = useRouter();
  const { sessions, settings, exercises } = useWorkoutStore();
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const unit = settings?.unit || 'kg';

  const filteredSessions = sessions
    .filter(s => s.workoutName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const calculateDuration = (start: Date, end?: Date) => {
    if (!end) return 0;
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  };

  const calculateVolume = (sets: any[]) => {
    return sets.reduce((total, set) => total + (set.reps * set.weight), 0);
  };

  const handleDeleteSession = (session: SessionDetail) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete this ${session.workoutName} session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dbDeleteSession(session.id);
            setSelectedSession(null);
            // Refresh sessions
            const { loadData } = useWorkoutStore();
    await loadData();
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    const csvHeader = 'Date,Workout,Duration (min),Exercises,Volume (kg)\n';
    const csvRows = filteredSessions.map(s => {
      const date = new Date(s.startTime).toLocaleDateString();
      const duration = s.endTime ? calculateDuration(s.startTime, s.endTime) : 0;
      const exerciseCount = new Set(s.sets.map(set => set.exerciseId)).size;
      const volume = calculateVolume(s.sets);
      return `${date},"${s.workoutName}",${duration},${exerciseCount},${volume}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    try {
      await Share.share({
        message: csv,
        title: 'Workout History Export',
      });
    } catch (e) {
      console.log('Export error:', e);
    }
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find((e: import('../types').Exercise) => e.id === exerciseId);
    return exercise?.name || `Exercise ${exerciseId}`;
  };

  // Group sets by exercise
  const groupSetsByExercise = (sets: any[]) => {
    const grouped: Record<string, any[]> = {};
    sets.forEach(set => {
      if (!grouped[set.exerciseId]) {
        grouped[set.exerciseId] = [];
      }
      grouped[set.exerciseId].push(set);
    });
    return grouped;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name={Icons.arrowLeft} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity onPress={handleExportCSV}>
          <Icon name={Icons.share} size={22} color="#F97316" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Icon name={Icons.search} size={18} color="#71717A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workouts..."
            placeholderTextColor="#52525B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name={Icons.calendar} size={48} color="#3F3F46" />
            <Text style={styles.emptyTitle}>No Sessions Yet</Text>
            <Text style={styles.emptyDesc}>Complete a workout to see your history</Text>
          </View>
        ) : (
          filteredSessions.map((session) => {
            const duration = session.endTime ? calculateDuration(session.startTime, session.endTime) : 0;
            const volume = calculateVolume(session.sets);
            const exerciseCount = new Set(session.sets.map(s => s.exerciseId)).size;

            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => setSelectedSession(session)}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionName}>{session.workoutName}</Text>
                  <Icon name={Icons.chevronRight} size={18} color="#52525B" />
                </View>

                <View style={styles.sessionMeta}>
                  <View style={styles.metaItem}>
                    <Icon name={Icons.calendar} size={14} color="#71717A" />
                    <Text style={styles.metaText}>
                      {new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name={Icons.clock} size={14} color="#71717A" />
                    <Text style={styles.metaText}>{duration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name={Icons.list} size={14} color="#71717A" />
                    <Text style={styles.metaText}>{exerciseCount} exercises</Text>
                  </View>
                </View>

                <View style={styles.sessionFooter}>
                  <Text style={styles.volumeText}>{formatVolume(volume, unit)} volume</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Session Detail Modal */}
      <Modal visible={!!selectedSession} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSession && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedSession.workoutName}</Text>
                    <Text style={styles.modalDate}>
                      {new Date(selectedSession.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedSession(null)}>
                    <Icon name={Icons.x} size={24} color="#71717A" />
                  </TouchableOpacity>
                </View>

                {/* Exercise Details */}
                <ScrollView style={styles.modalBody}>
                  {Object.entries(groupSetsByExercise(selectedSession.sets)).map(([exerciseId, sets]) => (
                    <View key={exerciseId} style={styles.exerciseSection}>
                      <Text style={styles.exerciseName}>{getExerciseName(exerciseId)}</Text>
                      <View style={styles.setsTable}>
                        <View style={styles.setsHeader}>
                          <Text style={styles.setHeaderText}>Set</Text>
                          <Text style={styles.setHeaderText}>Reps</Text>
                          <Text style={styles.setHeaderText}>Weight</Text>
                        </View>
                        {sets.map((set, idx) => (
                          <View key={idx} style={styles.setRow}>
                            <Text style={styles.setText}>{idx + 1}</Text>
                            <Text style={styles.setText}>{set.reps}</Text>
                            <Text style={styles.setText}>{set.weight}{unit}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                  {selectedSession.notes && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesLabel}>Notes</Text>
                      <Text style={styles.notesText}>{selectedSession.notes}</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Delete Button */}
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSession(selectedSession)}>
                  <Icon name={Icons.trash} size={18} color="#EF4444" />
                  <Text style={styles.deleteText}>Delete Session</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function formatVolume(volume: number, unit: string) {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k ${unit}`;
  }
  return `${volume} ${unit}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#27272A' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, color: '#fff', fontSize: 16 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#71717A', marginTop: 4 },
  sessionCard: { backgroundColor: '#18181B', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sessionName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  sessionMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#71717A' },
  sessionFooter: { borderTopWidth: 1, borderTopColor: '#27272A', paddingTop: 12 },
  volumeText: { fontSize: 13, color: '#F97316', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272A' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  modalDate: { fontSize: 14, color: '#71717A', marginTop: 4 },
  modalBody: { padding: 20 },
  exerciseSection: { marginBottom: 20 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#F97316', marginBottom: 8 },
  setsTable: { backgroundColor: '#27272A', borderRadius: 8, overflow: 'hidden' },
  setsHeader: { flexDirection: 'row', padding: 10, backgroundColor: '#3F3F46' },
  setHeaderText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#71717A', textAlign: 'center' },
  setRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#3F3F46' },
  setText: { flex: 1, fontSize: 14, color: '#fff', textAlign: 'center' },
  notesSection: { marginTop: 16, padding: 16, backgroundColor: '#27272A', borderRadius: 12 },
  notesLabel: { fontSize: 14, fontWeight: '600', color: '#71717A', marginBottom: 8 },
  notesText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#27272A' },
  deleteText: { fontSize: 16, color: '#EF4444', fontWeight: '500' },
});