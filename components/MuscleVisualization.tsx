import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MuscleVisualizationProps {
  muscleGroups: string[];
}

const musclePositions: Record<string, { top: number; left: number; width: number; height: number }> = {
  Chest: { top: 45, left: 35, width: 30, height: 20 },
  Back: { top: 45, left: 35, width: 30, height: 25 },
  Shoulders: { top: 35, left: 25, width: 50, height: 15 },
  Arms: { top: 55, left: 15, width: 15, height: 30 },
  Legs: { top: 80, left: 30, width: 40, height: 60 },
  Core: { top: 60, left: 40, width: 20, height: 20 },
};

export function MuscleVisualization({ muscleGroups }: MuscleVisualizationProps) {
  const normalizedMuscles = muscleGroups.map(m => m.toLowerCase());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Targeted Muscles</Text>
      <View style={styles.bodyContainer}>
        {/* Body outline */}
        <View style={styles.bodyOutline}>
          {/* Head */}
          <View style={styles.head} />
          {/* Torso */}
          <View style={styles.torso} />
          {/* Left arm */}
          <View style={styles.leftArm} />
          {/* Right arm */}
          <View style={styles.rightArm} />
          {/* Left leg */}
          <View style={styles.leftLeg} />
          {/* Right leg */}
          <View style={styles.rightLeg} />
        </View>

        {/* Muscle overlays */}
        {Object.entries(musclePositions).map(([muscle, pos]) => {
          const isTargeted = normalizedMuscles.includes(muscle.toLowerCase());
          if (!isTargeted) return null;
          return (
            <View
              key={muscle}
              style={[
                styles.muscleOverlay,
                {
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  height: pos.height,
                },
              ]}
            >
              <Text style={styles.muscleLabel}>{muscle}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {muscleGroups.map(m => (
          <View key={m} style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>{m}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  bodyContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyOutline: {
    width: 100,
    height: 140,
    position: 'relative',
  },
  head: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3F3F46',
    position: 'absolute',
    top: 0,
    left: 38,
  },
  torso: {
    width: 36,
    height: 40,
    backgroundColor: '#3F3F46',
    position: 'absolute',
    top: 28,
    left: 32,
    borderRadius: 4,
  },
  leftArm: {
    width: 12,
    height: 45,
    backgroundColor: '#3F3F46',
    position: 'absolute',
    top: 30,
    left: 16,
    borderRadius: 4,
  },
  rightArm: {
    width: 12,
    height: 45,
    backgroundColor: '#3F3F46',
    position: 'absolute',
    top: 30,
    right: 16,
    borderRadius: 4,
  },
  leftLeg: {
    width: 14,
    height: 55,
    backgroundColor: '#3F3F46',
    position: 'absolute',
    top: 70,
    left: 32,
    borderRadius: 4,
  },
  rightLeg: {
    width: 14,
    height: 55,
    backgroundColor: '#3F3F46',
    position: 'absolute',
    top: 70,
    right: 32,
    borderRadius: 4,
  },
  muscleOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(249, 115, 22, 0.4)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F97316',
  },
  muscleLabel: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  legendText: {
    fontSize: 12,
    color: '#fff',
  },
});