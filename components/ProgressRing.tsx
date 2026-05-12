import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  subtitle?: string;
  animated?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = '#F97316',
  backgroundColor = '#27272A',
  showPercentage = true,
  label,
  subtitle,
  animated = true,
}: ProgressRingProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />

      {/* Animated progress ring */}
      <Animated.View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate }],
          },
        ]}
      />

      {/* Inner content */}
      <View style={styles.content}>
        {showPercentage && (
          <Text style={styles.percentage}>{percentage}%</Text>
        )}
        {label && <Text style={styles.label}>{label}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</subtitle>}
      </View>
    </View>
  );
}

interface StatsRingProps {
  label: string;
  value: number;
  total: number;
  color?: string;
  size?: number;
}

export function StatsRing({ label, value, total, color = '#F97316', size = 80 }: StatsRingProps) {
  const progress = total > 0 ? value / total : 0;

  return (
    <View style={styles.statsRingContainer}>
      <ProgressRing
        progress={progress}
        size={size}
        strokeWidth={6}
        color={color}
        showPercentage={false}
      />
      <View style={styles.statsRingContent}>
        <Text style={[styles.statsValue, { fontSize: size / 3.5 }]}>{value}</Text>
        <Text style={[styles.statsLabel, { fontSize: size / 6 }]}>{label}</Text>
      </View>
    </View>
  );
}

interface WeeklyGoalRingProps {
  completed: number;
  goal: number;
  label?: string;
}

export function WeeklyGoalRing({ completed, goal, label = 'Weekly Goal' }: WeeklyGoalRingProps) {
  const progress = goal > 0 ? Math.min(completed / goal, 1) : 0;
  const color = progress >= 1 ? '#22C55E' : '#F97316';

  return (
    <View style={styles.weeklyContainer}>
      <ProgressRing
        progress={progress}
        size={140}
        strokeWidth={12}
        color={color}
        showPercentage={false}
      />
      <View style={styles.weeklyContent}>
        <Text style={styles.weeklyValue}>{completed}</Text>
        <Text style={styles.weeklyLabel}>of {goal}</Text>
        <Text style={styles.weeklySublabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  statsRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRingContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsValue: {
    fontWeight: '700',
    color: '#fff',
  },
  statsLabel: {
    color: '#71717A',
    marginTop: 2,
  },
  weeklyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  weeklyContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  weeklyValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  weeklyLabel: {
    fontSize: 14,
    color: '#71717A',
  },
  weeklySublabel: {
    fontSize: 12,
    color: '#52525B',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});