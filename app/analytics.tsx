import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../components/Icon';
import { useWorkoutStore } from '../stores/workoutStore';
import { getWeeklyVolumeStats, getMuscleGroupStats, getSessionHistoryStats, getRecentPRs, getWorkoutStreak, WeeklyVolumeStats, MuscleGroupStats } from '../lib/db';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();
  const { settings } = useWorkoutStore();
  const [weeklyData, setWeeklyData] = useState<WeeklyVolumeStats[]>([]);
  const [muscleData, setMuscleData] = useState<MuscleGroupStats[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, totalVolume: 0, avgDuration: 0, totalPRs: 0 });
  const [recentPRs, setRecentPRs] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const unit = settings?.unit || 'kg';

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [weekly, muscle, sessionStats, prs, streakData] = await Promise.all([
        getWeeklyVolumeStats(8),
        getMuscleGroupStats(),
        getSessionHistoryStats(),
        getRecentPRs(5),
        getWorkoutStreak(),
      ]);
      setWeeklyData(weekly);
      setMuscleData(muscle);
      setStats(sessionStats);
      setRecentPRs(prs);
      setStreak(streakData);
    } catch (e) {
      console.log('Error loading analytics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  const maxVolume = Math.max(...weeklyData.map(w => w.volume), 1);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name={Icons.arrowLeft} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Icon name={Icons.dumbbell} size={20} color="#F97316" />
            </View>
            <Text style={styles.summaryValue}>{stats.totalSessions}</Text>
            <Text style={styles.summaryLabel}>Workouts</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Icon name={Icons.trendingUp} size={20} color="#22C55E" />
            </View>
            <Text style={styles.summaryValue}>{formatVolume(stats.totalVolume)}</Text>
            <Text style={styles.summaryLabel}>Volume ({unit})</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Icon name={Icons.clock} size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.summaryValue}>{stats.avgDuration}</Text>
            <Text style={styles.summaryLabel}>Avg Min</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Icon name={Icons.trophy} size={20} color="#F59E0B" />
            </View>
            <Text style={styles.summaryValue}>{stats.totalPRs}</Text>
            <Text style={styles.summaryLabel}>PRs</Text>
          </View>
        </View>

        {/* Streak */}
        <View style={styles.streakCard}>
          <LinearGradient colors={['#F97316', '#EA580C']} style={styles.streakGradient} />
          <View style={styles.streakContent}>
            <Icon name={Icons.flame} size={32} color="#fff" />
            <View style={styles.streakText}>
              <Text style={styles.streakValue}>{streak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Weekly Volume Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Volume</Text>
          <View style={styles.chartContainer}>
            {weeklyData.length === 0 ? (
              <Text style={styles.emptyText}>No workout data yet</Text>
            ) : (
              <View style={styles.barChart}>
                {weeklyData.map((week, index) => (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          { height: `${(week.volume / maxVolume) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>
                      {week.week.split('-W')[1] || 'W'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Muscle Group Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Groups</Text>
          <View style={styles.muscleContainer}>
            {muscleData.length === 0 ? (
              <Text style={styles.emptyText}>No exercise data yet</Text>
            ) : (
              muscleData.map((item, index) => {
                const maxCount = Math.max(...muscleData.map(m => m.count), 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <View key={index} style={styles.muscleRow}>
                    <Text style={styles.muscleLabel}>{item.muscle}</Text>
                    <View style={styles.muscleBarContainer}>
                      <View style={[styles.muscleBar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.muscleCount}>{item.count}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Recent PRs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent PRs</Text>
          {recentPRs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name={Icons.trophy} size={24} color="#52525B" />
              <Text style={styles.emptyText}>No PRs yet. Keep lifting!</Text>
            </View>
          ) : (
            recentPRs.map((pr, index) => (
              <View key={index} style={styles.prCard}>
                <View style={styles.prIcon}>
                  <Icon name={Icons.trophy} size={16} color="#F59E0B" />
                </View>
                <View style={styles.prInfo}>
                  <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                  <Text style={styles.prDate}>
                    {new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.prValue}>
                  {pr.max_weight}{unit} × {pr.max_reps}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Icon name={Icons.sparkles} size={20} color="#8B5CF6" />
            <Text style={styles.insightText}>
              {stats.totalSessions === 0
                ? 'Start your first workout to see insights!'
                : stats.totalSessions < 10
                ? 'Keep going! You need more data for detailed insights.'
                : `You're averaging ${stats.avgDuration} minutes per workout. Great consistency!`}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, backgroundColor: '#18181B', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(249, 115, 22, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryValue: { fontSize: 24, fontWeight: '700', color: '#fff' },
  summaryLabel: { fontSize: 12, color: '#71717A', marginTop: 4 },
  streakCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  streakGradient: { padding: 20 },
  streakContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakText: { flex: 1 },
  streakValue: { fontSize: 36, fontWeight: '700', color: '#fff' },
  streakLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  chartContainer: { backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#27272A' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120 },
  barContainer: { flex: 1, alignItems: 'center' },
  barWrapper: { height: 100, width: '80%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#F97316', borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#71717A', marginTop: 4 },
  muscleContainer: { backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#27272A' },
  muscleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  muscleLabel: { width: 80, fontSize: 13, color: '#71717A' },
  muscleBarContainer: { flex: 1, height: 8, backgroundColor: '#27272A', borderRadius: 4, marginHorizontal: 8 },
  muscleBar: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 },
  muscleCount: { width: 30, fontSize: 12, color: '#71717A', textAlign: 'right' },
  emptyCard: { backgroundColor: '#18181B', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  emptyText: { fontSize: 14, color: '#71717A', marginTop: 8 },
  prCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#27272A' },
  prIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245, 158, 11, 0.2)', justifyContent: 'center', alignItems: 'center' },
  prInfo: { flex: 1, marginLeft: 12 },
  prExercise: { fontSize: 14, fontWeight: '600', color: '#fff' },
  prDate: { fontSize: 12, color: '#71717A', marginTop: 2 },
  prValue: { fontSize: 14, fontWeight: '600', color: '#F97316' },
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#27272A' },
  insightText: { flex: 1, fontSize: 14, color: '#71717A', lineHeight: 20 },
});