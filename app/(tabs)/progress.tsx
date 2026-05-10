import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { useWorkoutStore } from '../../stores/workoutStore';
import { Icon, Icons } from '../../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function Progress() {
  const { personalRecords, sessions, exercises } = useWorkoutStore();
  const [showOneRM, setShowOneRM] = useState(false);
  const [oneRMWeight, setOneRMWeight] = useState('');
  const [oneRMReps, setOneRMReps] = useState('');
  const [bodyWeight, setBodyWeight] = useState('75');
  const [showBodyTracker, setShowBodyTracker] = useState(false);

  const calculateOneRM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const getVolumeData = () => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= weekStart && sessionDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      });
      const volume = weekSessions.reduce((acc, session) => {
        return acc + session.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
      }, 0);
      weeks.push({ label: `W${4 - i}`, volume: volume / 1000 });
    }
    return weeks;
  };

  const getMuscleBalance = () => {
    const muscleGroups: Record<string, number> = {};
    sessions.forEach(session => {
      session.sets.forEach(set => {
        const exercise = exercises.find(e => e.id === set.exerciseId);
        if (exercise) {
          exercise.muscleGroups.forEach(muscle => {
            muscleGroups[muscle] = (muscleGroups[muscle] || 0) + (set.weight * set.reps);
          });
        }
      });
    });
    const total = Object.values(muscleGroups).reduce((a, b) => a + b, 0);
    return Object.entries(muscleGroups)
      .map(([muscle, volume]) => ({ muscle, percentage: Math.round((volume / total) * 100) || 0 }))
      .sort((a, b) => b.percentage - a.percentage);
  };

  const getWeeklyLoad = () => {
    const thisWeek = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    });
    const lastWeek = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= twoWeeksAgo && sessionDate < weekAgo;
    });
    const thisWeekLoad = thisWeek.reduce((acc, s) => acc + s.sets.reduce((sum, set) => sum + set.weight * set.reps, 0), 0);
    const lastWeekLoad = lastWeek.reduce((acc, s) => acc + s.sets.reduce((sum, set) => sum + set.weight * set.reps, 0), 0);
    return { thisWeek: thisWeekLoad / 1000, lastWeek: lastWeekLoad / 1000 };
  };

  const generateHeatmap = () => {
    const days = [];
    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const hasWorkout = sessions.some(s => new Date(s.startTime).toDateString() === date.toDateString());
      days.push({ date, intensity: hasWorkout ? Math.random() * 0.5 + 0.5 : 0 });
    }
    return days;
  };

  const heatmapData = generateHeatmap();
  const volumeData = getVolumeData();
  const muscleBalance = getMuscleBalance();
  const weeklyLoad = getWeeklyLoad();

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return '#18181B';
    if (intensity < 0.3) return '#451a03';
    if (intensity < 0.6) return '#7c2d12';
    return '#F97316';
  };

  const maxVolume = Math.max(...volumeData.map(v => v.volume)) || 1;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Progress</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name={Icons.calendar} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>28-Day Activity</Text>
          </View>
          <View style={styles.heatmap}>
            {heatmapData.map((day, index) => (
              <View key={index} style={[styles.heatmapDay, { backgroundColor: getIntensityColor(day.intensity) }]} />
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon name={Icons.activity} size={24} color="#F97316" />
            <Text style={styles.statValue}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name={Icons.trophy} size={24} color="#F97316" />
            <Text style={styles.statValue}>{personalRecords.length}</Text>
            <Text style={styles.statLabel}>PRs</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name={Icons.trendingUp} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>Weekly Volume</Text>
          </View>
          <View style={styles.chartContainer}>
            {volumeData.map((week, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={[styles.bar, { height: (week.volume / maxVolume) * 100 }]} />
                <Text style={styles.barLabel}>{week.label}</Text>
                <Text style={styles.barValue}>{week.volume.toFixed(1)}t</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name={Icons.dumbbell} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>Muscle Balance</Text>
          </View>
          {muscleBalance.map((item, index) => (
            <View key={index} style={styles.muscleRow}>
              <Text style={styles.muscleName}>{item.muscle}</Text>
              <View style={styles.muscleBar}>
                <View style={[styles.muscleFill, { width: `${item.percentage}%` }]} />
              </View>
              <Text style={styles.musclePercent}>{item.percentage}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowOneRM(!showOneRM)}>
            <Icon name={Icons.calculator} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>1RM Estimator</Text>
            <Icon name={showOneRM ? Icons.chevronDown : Icons.chevronRight} size={16} color="#71717A" />
          </TouchableOpacity>
          {showOneRM && (
            <View style={styles.oneRMContainer}>
              <View style={styles.oneRMInputs}>
                <View style={styles.oneRMInputGroup}>
                  <Text style={styles.inputLabel}>Weight</Text>
                  <TextInput
                    style={styles.oneRMInput}
                    value={oneRMWeight}
                    onChangeText={setOneRMWeight}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#52525B"
                  />
                </View>
                <Text style={styles.oneRMX}>×</Text>
                <View style={styles.oneRMInputGroup}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.oneRMInput}
                    value={oneRMReps}
                    onChangeText={setOneRMReps}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#52525B"
                  />
                </View>
              </View>
              {oneRMWeight && oneRMReps && (
                <View style={styles.oneRMResult}>
                  <Text style={styles.oneRMLabel}>Estimated 1RM</Text>
                  <Text style={styles.oneRMValue}>{calculateOneRM(parseFloat(oneRMWeight), parseInt(oneRMReps))} kg</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowBodyTracker(!showBodyTracker)}>
            <Icon name={Icons.flame} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>Body Weight</Text>
            <Icon name={showBodyTracker ? Icons.chevronDown : Icons.chevronRight} size={16} color="#71717A" />
          </TouchableOpacity>
          {showBodyTracker && (
            <View style={styles.bodyWeightContainer}>
              <View style={styles.bodyWeightInput}>
                <TextInput
                  style={styles.bodyWeightInputField}
                  value={bodyWeight}
                  onChangeText={setBodyWeight}
                  keyboardType="numeric"
                />
                <Text style={styles.bodyWeightUnit}>kg</Text>
              </View>
              <Text style={styles.bodyWeightInfo}>Track your body weight over time</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name={Icons.calendar} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>Weekly Load</Text>
          </View>
          <View style={styles.weeklyLoadRow}>
            <View style={styles.weeklyLoadItem}>
              <Text style={styles.weeklyLoadLabel}>This Week</Text>
              <Text style={styles.weeklyLoadValue}>{weeklyLoad.thisWeek.toFixed(1)}t</Text>
            </View>
            <View style={styles.weeklyLoadItem}>
              <Text style={styles.weeklyLoadLabel}>Last Week</Text>
              <Text style={styles.weeklyLoadValue}>{weeklyLoad.lastWeek.toFixed(1)}t</Text>
            </View>
            <View style={styles.weeklyLoadItem}>
              <Text style={styles.weeklyLoadLabel}>Change</Text>
              <Text style={[styles.weeklyLoadValue, weeklyLoad.thisWeek >= weeklyLoad.lastWeek ? styles.loadUp : styles.loadDown]}>
                {weeklyLoad.lastWeek > 0 ? `${Math.round(((weeklyLoad.thisWeek - weeklyLoad.lastWeek) / weeklyLoad.lastWeek) * 100)}%` : '-'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name={Icons.activity} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>Session History</Text>
          </View>
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet</Text>
          ) : (
            sessions.slice(0, 10).map((session, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{session.workoutName}</Text>
                  <Text style={styles.historyDate}>{new Date(session.startTime).toLocaleDateString()}</Text>
                </View>
                <View style={styles.historyStats}>
                  <Text style={styles.historySets}>{session.sets.length} sets</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name={Icons.trophy} size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>PR Board</Text>
          </View>
          {personalRecords.length === 0 ? (
            <Text style={styles.emptyText}>No PRs yet</Text>
          ) : (
            personalRecords.map((pr) => (
              <View key={pr.id} style={styles.prCard}>
                <View style={styles.prInfo}>
                  <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                  <Text style={styles.prDate}>{new Date(pr.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.prValue}>
                  <Text style={styles.prWeight}>{pr.maxWeight}kg</Text>
                  <Text style={styles.prReps}>× {pr.maxReps}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  heatmapDay: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#27272A' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#18181B', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#71717A', marginTop: 4 },
  prCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#27272A' },
  prInfo: { flex: 1 },
  prExercise: { fontSize: 16, fontWeight: '600', color: '#fff' },
  prDate: { fontSize: 12, color: '#71717A', marginTop: 2 },
  prValue: { alignItems: 'flex-end' },
  prWeight: { fontSize: 20, fontWeight: '700', color: '#F97316' },
  prReps: { fontSize: 12, color: '#71717A' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, backgroundColor: '#18181B', borderRadius: 12, padding: 16, marginBottom: 12 },
  barContainer: { alignItems: 'center', flex: 1 },
  bar: { width: 40, backgroundColor: '#F97316', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#71717A', marginTop: 4 },
  barValue: { fontSize: 10, color: '#71717A' },
  muscleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  muscleName: { width: 80, fontSize: 14, color: '#fff', textTransform: 'capitalize' },
  muscleBar: { flex: 1, height: 8, backgroundColor: '#27272A', borderRadius: 4, marginHorizontal: 8 },
  muscleFill: { height: 8, backgroundColor: '#F97316', borderRadius: 4 },
  musclePercent: { width: 40, fontSize: 12, color: '#71717A', textAlign: 'right' },
  oneRMContainer: { backgroundColor: '#18181B', borderRadius: 12, padding: 16 },
  oneRMInputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 },
  oneRMInputGroup: { alignItems: 'center' },
  inputLabel: { fontSize: 12, color: '#71717A', marginBottom: 4 },
  oneRMInput: { backgroundColor: '#27272A', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 18, width: 80, textAlign: 'center' },
  oneRMX: { fontSize: 18, color: '#71717A', marginTop: 16 },
  oneRMResult: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#27272A' },
  oneRMLabel: { fontSize: 12, color: '#71717A' },
  oneRMValue: { fontSize: 32, fontWeight: '700', color: '#F97316', marginTop: 4 },
  bodyWeightContainer: { backgroundColor: '#18181B', borderRadius: 12, padding: 16 },
  bodyWeightInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bodyWeightInputField: { backgroundColor: '#27272A', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, color: '#fff', fontSize: 24, width: 100, textAlign: 'center' },
  bodyWeightUnit: { fontSize: 18, color: '#71717A' },
  bodyWeightInfo: { fontSize: 12, color: '#71717A', textAlign: 'center', marginTop: 12 },
  weeklyLoadRow: { flexDirection: 'row', gap: 12 },
  weeklyLoadItem: { flex: 1, backgroundColor: '#18181B', borderRadius: 12, padding: 16, alignItems: 'center' },
  weeklyLoadLabel: { fontSize: 12, color: '#71717A' },
  weeklyLoadValue: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 4 },
  loadUp: { color: '#22C55E' },
  loadDown: { color: '#E24B4A' },
  emptyText: { fontSize: 14, color: '#71717A', textAlign: 'center', padding: 20 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', padding: 16, borderRadius: 12, marginBottom: 8 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  historyDate: { fontSize: 12, color: '#71717A', marginTop: 2 },
  historyStats: { alignItems: 'flex-end' },
  historySets: { fontSize: 14, color: '#F97316' },
});