import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../../components/Icon';
import { useWorkoutStore } from '../../stores/workoutStore';
import { aiService } from '../../lib/aiService';
import { MotivationalQuote } from '../../components/MotivationalQuote';
import { ProgressRing } from '../../components/ProgressRing';
import { SkeletonCard } from '../../components/SkeletonCard';
import { useThemeColors } from '../../theme/themeColors';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const { workouts, sessions, personalRecords, startSession } = useWorkoutStore();
  const [isOnDeviceAI, setIsOnDeviceAI] = useState(false);
  const [workoutSearch, setWorkoutSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  
  const streak = useMemo(() => sessions.length > 0 ? Math.min(sessions.length, 30) : 0, [sessions.length]);
  const weeklyWorkouts = useMemo(() => {
   const weekAgo = new Date();
   weekAgo.setDate(weekAgo.getDate() - 7);
   return sessions.filter((s: { startTime: Date }) => new Date(s.startTime) >= weekAgo).length;
 }, [sessions]);

  React.useEffect(() => {
    const check = async () => {
      const status = await aiService.checkOnDeviceStatus();
      setIsOnDeviceAI(status.available);
      // Simulate loading for premium feel
      setTimeout(() => setIsLoading(false), 800);
    };
    check();
  }, []);

   const quickStartWorkout = async (workout: any) => {
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
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')} accessibilityLabel="Settings" accessibilityRole="button">
              <Icon name={Icons.settings} size={22} color="#A1A1AA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatButton} onPress={() => router.push('/chat')} accessibilityLabel="Open AI Coach" accessibilityRole="button">
              <Image source={require('../../assets/ai-avatar.png')} style={styles.aiAvatarIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <>
            <View style={styles.statsRow}>
              <SkeletonCard height={110} borderRadius={16} style={{ flex: 1 }} />
              <SkeletonCard height={110} borderRadius={16} style={{ flex: 1, marginLeft: 12 }} />
            </View>
            <View style={styles.statsRow}>
              <SkeletonCard height={56} borderRadius={12} style={{ flex: 1 }} />
              <SkeletonCard height={56} borderRadius={12} style={{ flex: 1, marginLeft: 12 }} />
              <SkeletonCard height={56} borderRadius={12} style={{ flex: 1, marginLeft: 12 }} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statCard}>
                <LinearGradient colors={['#F97316', '#EA580C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statGradient}>
                  <Icon name={Icons.flame} size={28} color="#fff" />
                  <Text style={styles.statValue}>{streak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => router.push('/schedule')} accessibilityLabel="View weekly schedule" accessibilityRole="button">
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
          </>
        )}

        {isLoading ? (
          <View style={styles.weeklyGoalSection}>
            <SkeletonCard height={110} borderRadius={16} />
          </View>
        ) : (
          <View style={styles.weeklyGoalSection}>
            <View style={styles.weeklyGoalCard}>
              <View style={styles.weeklyGoalContent}>
                <View style={styles.weeklyGoalInfo}>
                  <Text style={styles.weeklyGoalTitle}>Weekly Goal</Text>
                  <Text style={styles.weeklyGoalSubtitle}>{weeklyWorkouts} of 4 workouts</Text>
                </View>
                <View style={styles.weeklyGoalRing}>
                  <ProgressRing progress={Math.min(weeklyWorkouts / 4, 1)} size={70} strokeWidth={6} color={weeklyWorkouts >= 4 ? '#22C55E' : '#F97316'} showPercentage={false} />
                  <Text style={styles.weeklyGoalPercent}>{Math.round(Math.min(weeklyWorkouts / 4, 1) * 100)}%</Text>
                </View>
              </View>
              <View style={styles.weeklyGoalProgress}>
                <View style={[styles.weeklyGoalProgressBar, { width: `${Math.min(weeklyWorkouts / 4 * 100, 100)}%`, backgroundColor: weeklyWorkouts >= 4 ? '#22C55E' : '#F97316' }]} />
              </View>
            </View>
          </View>
        )}

        <MotivationalQuote style="card" showAuthor={false} />

        <View style={styles.section}>
           <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Quick Start</Text>
             <TouchableOpacity onPress={() => router.push('/workouts')} activeOpacity={0.6}>
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
                accessibilityLabel="Search workouts"

              />
              {workoutSearch.length > 0 && (
                <TouchableOpacity onPress={() => setWorkoutSearch('')} accessibilityLabel="Clear search" accessibilityRole="button">
                  <Icon name={Icons.x} size={16} color="#71717A" />
                </TouchableOpacity>
              )}
            </View>
          )}

           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             {(workoutSearch ? workouts.filter((w: import('../../types').Workout) => w.name.toLowerCase().includes(workoutSearch.toLowerCase())) : workouts).map((workout: import('../../types').Workout) => {
              const lastSession = sessions.filter((s: import('../../types').WorkoutSession) => s.workoutId === workout.id).pop();
              const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24)) : null;
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => quickStartWorkout(workout)}
                   accessibilityLabel={`Start ${workout.name} workout`}
                >
                  <View style={[styles.workoutType, workout.type === 'gym' ? styles.gymType : styles.homeType]}>
                    <Text style={styles.workoutTypeText}>{workout.type === 'gym' ? 'Gym' : 'Home'}</Text>
                  </View>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutExercises}>{workout.exercises.length} exercises</Text>
                   {daysSince !== null ? (
                     <Text style={styles.lastPerformed}>
                       {daysSince === 0 ? 'Done today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                     </Text>
                   ) : (
                     <Text style={styles.lastPerformed}>Never done</Text>
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
             <View style={styles.aiIcon}>
               <Icon name={Icons.chevronRight} size={20} color="#71717A" />
             </View>
           </View>
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
            sessions.slice(0, 3).map((session: import('../../types').WorkoutSession) => (
              <View key={session.startTime.toString()} style={styles.activityCard}>
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

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: themeColors.textSecondary },
  title: { fontSize: 28, fontWeight: '700', color: themeColors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: themeColors.cardBackground, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: themeColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  chatButton: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  aiAvatarIcon: { width: '100%', height: '100%', borderRadius: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  statGradient: { padding: 16, alignItems: 'center' },
  statGradientPurple: { padding: 16, alignItems: 'center', flex: 1 },
  statCardInner: { backgroundColor: themeColors.cardBackground, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: themeColors.border },
  statValue: { fontSize: 32, fontWeight: '700', color: themeColors.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 12, color: `${themeColors.textPrimary}CC`, marginTop: 4 },
  statValue2: { fontSize: 32, fontWeight: '700', color: themeColors.textPrimary, marginTop: 8 },
  statLabel2: { fontSize: 12, color: themeColors.textSecondary, marginTop: 4 },
  miniStat: { flex: 1, flexDirection: 'column', alignItems: 'center', backgroundColor: themeColors.cardBackground, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: themeColors.border, minHeight: 56, justifyContent: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '700', color: themeColors.textPrimary },
  miniStatLabel: { fontSize: 11, color: themeColors.textSecondary, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: themeColors.textPrimary },
  seeAll: { fontSize: 14, color: themeColors.primary },
  workoutSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.cardBackground, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, borderWidth: 1, borderColor: themeColors.border, gap: 8 },
  workoutSearchInput: { flex: 1, color: themeColors.textPrimary, fontSize: 14 },
  workoutCard: { width: width * 0.6, backgroundColor: themeColors.cardBackground, borderRadius: 16, padding: 16, marginRight: 12, borderWidth: 1, borderColor: themeColors.border },
  workoutType: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  gymType: { backgroundColor: `${themeColors.primary}20` },
  homeType: { backgroundColor: `${themeColors.success}20` },
  workoutTypeText: { fontSize: 12, fontWeight: '600', color: themeColors.primary },
  workoutName: { fontSize: 18, fontWeight: '600', color: themeColors.textPrimary, marginBottom: 4 },
  workoutExercises: { fontSize: 13, color: themeColors.textSecondary, marginBottom: 4 },
  lastPerformed: { fontSize: 11, color: themeColors.success, marginBottom: 8 },
  workoutAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  startText: { fontSize: 14, fontWeight: '600', color: themeColors.primary },
  aiCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: themeColors.cardBackground, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: themeColors.border, marginBottom: 24 },
  aiCtaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${themeColors.primary}20`, justifyContent: 'center', alignItems: 'center' },
  aiCtaText: { gap: 2 },
  aiCtaTitle: { fontSize: 16, fontWeight: '600', color: themeColors.textPrimary },
  aiCtaDesc: { fontSize: 12, color: themeColors.textSecondary },
  emptyState: { backgroundColor: themeColors.cardBackground, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: themeColors.border },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: themeColors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: themeColors.textSecondary, marginBottom: 4 },
  emptyText: { fontSize: 13, color: themeColors.textSecondary, textAlign: 'center', marginBottom: 16 },
  emptyCTA: { backgroundColor: themeColors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyCTAText: { fontSize: 14, fontWeight: '600', color: themeColors.textPrimary },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.cardBackground, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: themeColors.border },
  activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${themeColors.success}20`, justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1 },
  weeklyGoalSection: { marginBottom: 16 },
  weeklyGoalCard: { backgroundColor: themeColors.cardBackground, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: themeColors.border },
  weeklyGoalContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  weeklyGoalInfo: { flex: 1 },
  weeklyGoalTitle: { fontSize: 16, fontWeight: '600', color: themeColors.textPrimary, marginBottom: 4 },
  weeklyGoalSubtitle: { fontSize: 13, color: themeColors.textSecondary },
  weeklyGoalRing: { alignItems: 'center' },
  weeklyGoalPercent: { fontSize: 14, fontWeight: '600', color: themeColors.primary, marginTop: 4 },
  weeklyGoalProgress: { height: 6, backgroundColor: themeColors.border, borderRadius: 3, overflow: 'hidden' },
  weeklyGoalProgressBar: { height: '100%', borderRadius: 3 },
  activityName: { fontSize: 15, fontWeight: '600', color: themeColors.textPrimary },
  activityDate: { fontSize: 12, color: themeColors.textSecondary, marginTop: 2 },
  activitySets: { fontSize: 13, color: themeColors.primary },
});