import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from './Icon';

const { width } = Dimensions.get('window');

interface CelebrationBadgeProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Icons;
  color?: string;
  onHide?: () => void;
  duration?: number;
}

export function CelebrationBadge({
  visible,
  title,
  subtitle,
  icon = Icons.trophy,
  color = '#F97316',
  onHide,
  duration = 3000,
}: CelebrationBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacityAnim.setValue(1);
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(particleAnim1, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(particleAnim1, { toValue: 0, duration: 800, useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(particleAnim2, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(particleAnim2, { toValue: 0, duration: 800, useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(particleAnim3, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(particleAnim3, { toValue: 0, duration: 800, useNativeDriver: true }),
          ])
        ),
      ]).start();

      const timeout = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const particle1Y = particleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });
  const particle2Y = particleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });
  const particle3Y = particleAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -35],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      {/* Floating particles */}
      <Animated.View style={[styles.particle, styles.particle1, { transform: [{ translateY: particle1Y }] }]} />
      <Animated.View style={[styles.particle, styles.particle2, { transform: [{ translateY: particle2Y }] }]} />
      <Animated.View style={[styles.particle, styles.particle3, { transform: [{ translateY: particle3Y }] }]} />

      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { scale: scaleAnim },
              { rotate },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[color, color + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        {/* Inner glow */}
        <View style={styles.innerGlow} />

        {/* Badge icon container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <Icon name={icon} size={48} color="#fff" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}

        {/* Decorative elements */}
        <View style={styles.starsContainer}>
          <Text style={styles.star}>✦</Text>
          <Text style={[styles.star, styles.starDelayed]}>✦</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

interface WorkoutCompleteBadgeProps {
  visible: boolean;
  workoutName: string;
  duration: string;
  onHide?: () => void;
}

export function WorkoutCompleteBadge({
  visible,
  workoutName,
  duration,
  onHide,
}: WorkoutCompleteBadgeProps) {
  return (
    <CelebrationBadge
      visible={visible}
      title="WORKOUT COMPLETE!"
      subtitle={workoutName}
      icon={Icons.checkCircle}
      color="#22C55E"
      onHide={onHide}
    />
  );
}

interface PRBadgeProps {
  visible: boolean;
  exerciseName: string;
  weight: number;
  reps: number;
  onHide?: () => void;
}

export function PRBadge({
  visible,
  exerciseName,
  weight,
  reps,
  onHide,
}: PRBadgeProps) {
  return (
    <CelebrationBadge
      visible={visible}
      title="NEW PR!"
      subtitle={`${exerciseName} - ${weight}kg × ${reps}`}
      icon={Icons.trophy}
      color="#F97316"
      onHide={onHide}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
  },
  container: {
    width: width * 0.75,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  innerGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 75,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  star: {
    fontSize: 20,
    color: '#fff',
    opacity: 0.8,
  },
  starDelayed: {
    opacity: 0.5,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  particle1: {
    top: '30%',
    left: '25%',
  },
  particle2: {
    top: '40%',
    right: '25%',
    backgroundColor: '#22C55E',
  },
  particle3: {
    top: '50%',
    left: '30%',
    backgroundColor: '#8B5CF6',
  },
});