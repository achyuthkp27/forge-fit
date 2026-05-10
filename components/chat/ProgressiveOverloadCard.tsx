import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, Icons } from '../Icon';

interface OverloadSuggestion {
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
}

interface Props {
  suggestions: OverloadSuggestion[];
  onApply: (exerciseName: string, newWeight: number) => void;
  onDismiss: () => void;
}

export function ProgressiveOverloadCard({ suggestions, onApply, onDismiss }: Props) {
  if (suggestions.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyState}>
          <Icon name={Icons.trendingUp} size={32} color="#97C459" />
          <Text style={styles.emptyTitle}>Great progress!</Text>
          <Text style={styles.emptyText}>
            You're hitting your targets consistently! Keep it up — no weight increase needed right now.
          </Text>
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name={Icons.trendingUp} size={24} color="#97C459" />
        <Text style={styles.title}>Time to increase weight!</Text>
      </View>

      <Text style={styles.subtitle}>
        You've hit your rep targets consistently. Here are exercises ready for a weight increase:
      </Text>

      {suggestions.map((sug, index) => (
        <View key={index} style={styles.suggestionItem}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.exerciseName}>{sug.exerciseName}</Text>
          </View>
          <View style={styles.weightRow}>
            <Text style={styles.currentWeight}>{sug.currentWeight}kg → </Text>
            <Text style={styles.newWeight}>{sug.suggestedWeight}kg</Text>
          </View>
          <Text style={styles.reason}>{sug.reason}</Text>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => onApply(sug.exerciseName, sug.suggestedWeight)}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
        <Text style={styles.dismissBtnText}>Not now</Text>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#97C459',
  },
  subtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionItem: {
    backgroundColor: '#27272A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentWeight: {
    fontSize: 14,
    color: '#71717A',
  },
  newWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#97C459',
  },
  reason: {
    fontSize: 12,
    color: '#71717A',
    marginBottom: 10,
  },
  applyBtn: {
    backgroundColor: '#97C459',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D0D0D',
  },
  dismissBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 14,
    color: '#71717A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#97C459',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 20,
  },
});