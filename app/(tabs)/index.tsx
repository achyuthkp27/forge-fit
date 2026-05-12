import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../../components/Icon';
import { useWorkoutStore } from '../../stores/workoutStore';
import { aiService } from '../../lib/aiService';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const { workouts, sessions, personalRecords } = useWorkoutStore();
  const [isOnDeviceAI, setIsOnDeviceAI] = useState(false);
  const [workoutSearch, setWorkoutSearch] = useState('');
  
  const streak = sessions.length > 0 ? Math.min(sessions.length, 30) : 0;
  const weeklyWorkouts = sessions.filter(s => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(s.startTime) >= weekAgo;
  }).length;

  React.useEffect(() => {
    const check = async () => {
      const status = await aiService.checkOnDeviceStatus();
      setIsOnDeviceAI(status.available);
    };
    check();
  }, []);

  const quickStartWorkout = async (workout: any) => {
    const { startSession } = useWorkoutStore.getState();
    await startSession(workout);
    router.push('/workout');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.title}>ForgeFit</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
              <Icon name={Icons.settings} size={22} color="#A1A1AA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatButton} onPress={() => router.push('/chat')}>
              <LinearGradient colors={['#F97316', '#EA580C']} style={StyleSheet.absoluteFill} />
              <Icon name={Icons.messageCircle} size={22} color="#0D0D0D" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard}>
            <LinearGradient colors={['#F97316', '#EA580C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statGradient}>
              <Icon name={Icons.flame} size={28} color="#fff" />
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/schedule')}>
            <LinearGradient colors={['#8B5CF6', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.statGradientPurple, { flex: 1 }]}>
              <Icon name={Icons.calendar} size={24} color="#fff" />
              <Text style={styles.statValue}>{weeklyWorkouts}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.miniStat}>
            <Icon name={Icons.dumbbell} size={18} color="#22C55E" />
            <Text style={styles.miniStatValue}>{workouts.length}</Text>
            <Text style={styles.miniStatLabel}>Workouts</Text>
          </View>
          <View style={styles.miniStat}>
            <Icon name={Icons.trophy} size={18} color="#F97316" />
            <Text style={styles.miniStatValue}>{personalRecords.length}</Text>
            <Text style={styles.miniStatLabel}>PRs</Text>
          </View>
          <View style={styles.miniStat}>
            <Icon name={Icons.trendingUp} size={18} color="#8B5CF6" />
            <Text style={styles.miniStatValue}>{sessions.length}</Text>
            <Text style={styles.miniStatLabel}>Sessions</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Start</Text>
            <TouchableOpacity onPress={() => router.push('/workouts')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {workouts.length > 2 && (
            <View style={styles.workoutSearchContainer}>
              <Icon name={Icons.search} size={16} color="#52525B" />
              <TextInput
                style={styles.workoutSearchInput}
                placeholder="Search workouts..."
                placeholderTextColor="#52525B"
                value={workoutSearch}
                onChangeText={setWorkoutSearch}
              />
              {workoutSearch.length > 0 && (
                <TouchableOpacity onPress={() => setWorkoutSearch('')}>
                  <Icon name={Icons.x} size={16} color="#71717A" />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(workoutSearch ? workouts.filter(w => w.name.toLowerCase().includes(workoutSearch.toLowerCase())) : workouts.slice(0, 4)).map((workout) => {
              const lastSession = sessions.filter(s => s.workoutId === workout.id).pop();
              const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24)) : null;
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => quickStartWorkout(workout)}
                >
                  <View style={[styles.workoutType, workout.type === 'gym' ? styles.gymType : styles.homeType]}>
                    <Text style={styles.workoutTypeText}>{workout.type === 'gym' ? 'Gym' : 'Home'}</Text>
                  </View>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutExercises}>{workout.exercises.length} exercises</Text>
                  {daysSince !== null && (
                    <Text style={styles.lastPerformed}>
                      {daysSince === 0 ? 'Done today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                    </Text>
                  )}
                  <View style={styles.workoutAction}>
                    <Icon name={Icons.play} size={16} color="#F97316" />
                    <Text style={styles.startText}>Start</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.aiCta} onPress={() => router.push('/chat')}>
          <View style={styles.aiCtaContent}>
            <View style={styles.aiIcon}>
              <Icon name={Icons.sparkles} size={20} color="#F97316" />
            </View>
            <View style={styles.aiCtaText}>
              <Text style={styles.aiCtaTitle}>AI Coach</Text>
              <Text style={styles.aiCtaDesc}>
                {isOnDeviceAI ? 'ForgeFit AI Core' : 'Built-in AI • Create workouts, log sets'}
              </Text>
            </View>
          </View>
          <Icon name={Icons.chevronRight} size={20} color="#71717A" />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name={Icons.dumbbell} size={48} color="#3F3F46" />
              </View>
              <Text style={styles.emptyTitle}>No workouts yet</Text>
              <Text style={styles.emptyText}>Start a workout or chat with AI Coach</Text>
              <TouchableOpacity style={styles.emptyCTA} onPress={() => router.push('/chat')}>
                <Text style={styles.emptyCTAText}>Chat with AI Coach</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sessions.slice(0, 3).map((session, index) => (
              <View key={index} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Icon name={Icons.checkCircle} size={20} color="#22C55E" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{session.workoutName}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.activitySets}>{session.sets.length} sets</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#71717A' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  chatButton: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  statGradient: { padding: 16, alignItems: 'center' },
  statGradientPurple: { padding: 16, alignItems: 'center', flex: 1 },
  statCardInner: { backgroundColor: '#18181B', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  statValue: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statValue2: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 8 },
  statLabel2: { fontSize: 12, color: '#71717A', marginTop: 4 },
  miniStat: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: '#27272A', minHeight: 56 },
  miniStatValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  miniStatLabel: { fontSize: 11, color: '#71717A' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  seeAll: { fontSize: 14, color: '#F97316' },
  workoutSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, borderWidth: 1, borderColor: '#27272A', gap: 8 },
  workoutSearchInput: { flex: 1, color: '#fff', fontSize: 14 },
  workoutCard: { width: width * 0.6, backgroundColor: '#18181B', borderRadius: 16, padding: 16, marginRight: 12, borderWidth: 1, borderColor: '#27272A' },
  workoutType: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  gymType: { backgroundColor: 'rgba(249, 115, 22, 0.2)' },
  homeType: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  workoutTypeText: { fontSize: 12, fontWeight: '600', color: '#F97316' },
  workoutName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  workoutExercises: { fontSize: 13, color: '#71717A', marginBottom: 4 },
  lastPerformed: { fontSize: 11, color: '#22C55E', marginBottom: 8 },
  workoutAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  startText: { fontSize: 14, fontWeight: '600', color: '#F97316' },
  aiCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#18181B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#27272A', marginBottom: 24 },
  aiCtaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(249, 115, 22, 0.15)', justifyContent: 'center', alignItems: 'center' },
  aiCtaText: { gap: 2 },
  aiCtaTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  aiCtaDesc: { fontSize: 12, color: '#71717A' },
  emptyState: { backgroundColor: '#18181B', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#71717A', marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#52525B', textAlign: 'center', marginBottom: 16 },
  emptyCTA: { backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyCTAText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#27272A' },
  activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(34, 197, 94, 0.15)', justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  activityDate: { fontSize: 12, color: '#71717A', marginTop: 2 },
  activitySets: { fontSize: 13, color: '#F97316' },
});