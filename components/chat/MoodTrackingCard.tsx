import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, Icons } from '../Icon';

interface Props {
  onMoodSelect: (mood: 'low' | 'neutral' | 'high') => void;
}

const moods = [
  { id: 'low', label: 'Low Energy', icon: Icons.batteryLow, color: '#E24B4A', description: 'Feeling tired or fatigued' },
  { id: 'neutral', label: 'Normal', icon: Icons.batteryMedium, color: '#EF9F27', description: 'Feeling okay' },
  { id: 'high', label: 'High Energy', icon: Icons.batteryHigh, color: '#97C459', description: 'Feeling great!' },
];

export function MoodTrackingCard({ onMoodSelect }: Props) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedMood) {
      onMoodSelect(selectedMood as 'low' | 'neutral' | 'high');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name={Icons.heart} size={24} color="#F97316" />
        <Text style={styles.title}>How are you feeling today?</Text>
      </View>
      <Text style={styles.subtitle}>
        I'll adjust your workout based on your energy level
      </Text>

      <View style={styles.moodContainer}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodOption,
              selectedMood === mood.id && styles.moodOptionSelected,
            ]}
            onPress={() => setSelectedMood(mood.id)}
          >
            <Icon
              name={mood.icon as any}
              size={28}
              color={selectedMood === mood.id ? mood.color : '#71717A'}
            />
            <Text
              style={[
                styles.moodLabel,
                selectedMood === mood.id && { color: mood.color },
              ]}
            >
              {mood.label}
            </Text>
            <Text style={styles.moodDescription}>{mood.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.confirmBtn,
          !selectedMood && styles.confirmBtnDisabled,
        ]}
        onPress={handleConfirm}
        disabled={!selectedMood}
      >
        <Text style={styles.confirmBtnText}>Adjust Workout</Text>
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
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  moodOption: {
    flex: 1,
    backgroundColor: '#27272A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOptionSelected: {
    borderColor: '#F97316',
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  moodDescription: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 4,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#3F3F46',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});