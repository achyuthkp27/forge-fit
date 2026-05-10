import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, Icons } from '../Icon';

interface WeeklyStats {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  workoutsCompleted: string[];
  prsHit: string[];
  streakDays: number;
}

interface Props {
  stats: WeeklyStats;
  onDismiss: () => void;
}

export function WeeklySummaryCard({ stats, onDismiss }: Props) {
  const formatVolume = (vol: number) => {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toString();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name={Icons.calendar} size={24} color="#F97316" />
        <Text style={styles.title}>Weekly Summary</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalSets}</Text>
          <Text style={styles.statLabel}>Total Sets</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatVolume(stats.totalVolume)}</Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F97316' }]}>{stats.streakDays}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {stats.workoutsCompleted.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workouts Completed</Text>
          {stats.workoutsCompleted.map((workout, i) => (
            <View key={i} style={styles.listItem}>
              <Icon name={Icons.checkCircle} size={16} color="#97C459" />
              <Text style={styles.listItemText}>{workout}</Text>
            </View>
          ))}
        </View>
      )}

      {stats.prsHit.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New PRs This Week</Text>
          {stats.prsHit.map((pr, i) => (
            <View key={i} style={styles.listItem}>
              <Icon name={Icons.trophy} size={16} color="#EF9F27" />
              <Text style={styles.listItemText}>{pr}</Text>
            </View>
          ))}
        </View>
      )}

      {stats.totalWorkouts === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No workouts this week yet. Time to get moving!
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Text style={styles.dismissBtnText}>Got it</Text>
      </TouchableOpacity>
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 4,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  listItemText: {
    fontSize: 14,
    color: '#fff',
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
  },
  dismissBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 8,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});