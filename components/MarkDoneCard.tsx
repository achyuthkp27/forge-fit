import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, Icons } from './Icon';

interface Props {
  workoutName: string;
  startedAt: Date;
  setCount: number;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

export function MarkDoneCard({ workoutName, startedAt, setCount, onConfirm, onCancel }: Props) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const elapsed = Math.round((Date.now() - startedAt.getTime()) / 60000);

  async function handleConfirm() {
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
    onConfirm(note);
    setTimeout(() => setLoading(false), 500);
  }

  if (done) {
    return (
      <View style={styles.card}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.doneTitle}>Workout Complete!</Text>
        <Text style={styles.doneSub}>Saved to your history</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.workoutName}>{workoutName}</Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Active</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{elapsed}</Text>
          <Text style={styles.statLabel}>minutes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{setCount}</Text>
          <Text style={styles.statLabel}>sets logged</Text>
        </View>
      </View>

      <TextInput
        style={styles.noteInput}
        placeholder="Add a note... (optional)"
        placeholderTextColor="#71717A"
        value={note}
        onChangeText={setNote}
        returnKeyType="done"
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Not yet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>✓ Complete</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  activePill: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activePillText: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  noteInput: {
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#71717A',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 1.5,
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  trophy: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
    textAlign: 'center',
    marginBottom: 4,
  },
  doneSub: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
  },
});