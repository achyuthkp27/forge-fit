import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { WorkoutMatch } from '../../ai/workoutMatcher';
import type { RecoveryScore } from '../../ai/recoveryEngine';
import { Icon, Icons } from '../../components/Icon';

interface Props {
  workout: WorkoutMatch;
  explanation: string;
  recoveryScores: RecoveryScore[];
  alreadyTrainedToday: boolean;
  onStartWorkout: (workoutId: string) => void;
  onSuggestAlternative: () => void;
}

export function SuggestionCard({
  workout,
  explanation,
  recoveryScores,
  alreadyTrainedToday,
  onStartWorkout,
  onSuggestAlternative,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const topScores = recoveryScores
    .filter(s => workout.muscleGroups.includes(s.muscle))
    .slice(0, 3);

  return (
    <View style={styles.card}>
      {alreadyTrainedToday && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            You already trained today — this is your second session option
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <View style={styles.metaRow}>
            <TypeBadge type={workout.type} />
            <Text style={styles.duration}>~{workout.estimatedDuration} min</Text>
          </View>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scoreNum}>{workout.matchScore}</Text>
          <Text style={styles.scoreLabel}>match</Text>
        </View>
      </View>

      <Text style={styles.explanation}>{explanation}</Text>

      <TouchableOpacity
        style={styles.recoveryToggle}
        onPress={() => setExpanded(e => !e)}
      >
        <Text style={styles.recoveryToggleText}>
          {expanded ? 'Hide' : 'Show'} recovery detail
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.recoveryList}>
          {topScores.map(s => (
            <RecoveryBar key={s.muscle} score={s} />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => onStartWorkout(workout.id)}
        >
          <Text style={styles.startBtnText}>Start workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.altBtn}
          onPress={onSuggestAlternative}
        >
          <Text style={styles.altBtnText}>Suggest another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RecoveryBar({ score }: { score: RecoveryScore }) {
  const color =
    score.recoveryPercent >= 90 ? '#97C459' :
    score.recoveryPercent >= 50 ? '#EF9F27' : '#E24B4A';

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{score.muscle}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${score.recoveryPercent}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barPct, { color }]}>{score.recoveryPercent}%</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: string }) {
  const bg = type === 'gym' ? 'rgba(226,75,74,0.15)' : 'rgba(239,159,39,0.15)';
  const color = type === 'gym' ? '#E24B4A' : '#EF9F27';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginTop: 8,
  },
  warningBanner: {
    backgroundColor: 'rgba(239,159,39,0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  warningText: { fontSize: 12, color: '#EF9F27' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: { flex: 1 },
  workoutName: { fontSize: 17, fontWeight: '600', color: '#f0f0f0', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  duration: { fontSize: 12, color: '#888' },
  scorePill: {
    backgroundColor: 'rgba(151,196,89,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(151,196,89,0.25)',
  },
  scoreNum: { fontSize: 20, fontWeight: '700', color: '#97C459' },
  scoreLabel: { fontSize: 10, color: '#97C459', opacity: 0.7 },
  explanation: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  recoveryToggle: { marginBottom: 8 },
  recoveryToggleText: { fontSize: 12, color: '#555' },
  recoveryList: { gap: 8, marginBottom: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: 12, color: '#888', width: 72, textTransform: 'capitalize' },
  barTrack: {
    flex: 1, height: 6, backgroundColor: '#2e2e2e',
    borderRadius: 3, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barPct: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  startBtn: {
    flex: 1, backgroundColor: '#E24B4A',
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  altBtn: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
  },
  altBtnText: { color: '#888', fontSize: 14 },
});