import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons, IconName } from './Icon';

interface MiniStatProps {
  icon: IconName;
  iconColor: string;
  value: string | number;
  label: string;
  onPress?: () => void;
}

/**
 * Mini stat card for dashboard (used in row of 3)
 */
export function MiniStat({ icon, iconColor, value, label, onPress }: MiniStatProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.miniStat} onPress={onPress} accessibilityLabel={label} accessible={!!onPress}>
      <Icon name={icon} size={18} color={iconColor} accessible accessibilityLabel={`${label} icon`} />
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </Wrapper>
  );
}

interface StatCardProps {
  icon: IconName;
  iconColor: string;
  gradientColors?: string[];
  value: string | number;
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Large stat card with gradient background
 */
export function StatCard({ icon, iconColor, gradientColors, value, label, onPress, style }: StatCardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.statCard, style]} onPress={onPress} accessibilityLabel={label} accessible={!!onPress}>
      <LinearGradient
        colors={gradientColors as any || ['#F97316', '#EA580C'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      >
        <Icon name={icon} size={28} color="#fff" accessible accessibilityLabel={`${label} icon`} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Wrapper>
  );
}

interface IconStatProps {
  icon: IconName;
  color: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Icon-stat row component (common pattern in settings)
 */
export function IconStat({ icon, color, children, style }: IconStatProps) {
  return (
    <View style={[styles.iconStat, style]}>
      <Icon name={icon} size={20} color={color} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  miniStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    minHeight: 56,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#71717A',
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  iconStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default { MiniStat, StatCard, IconStat };