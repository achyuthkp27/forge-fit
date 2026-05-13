import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from '../components/Icon';
import { getAllBadges, BadgeData } from '../lib/db';

export default function BadgesScreen() {
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeData[]>([]);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    const data = await getAllBadges();
    setBadges(data);
  };

  const unlockedCount = badges.filter(b => b.unlockedAt).length;

  const getIconName = (icon: string): string => {
    const iconMap: Record<string, string> = {
      play: 'play',
      trophy: 'trophy',
      flame: 'flame',
      star: 'star',
      calendar: 'calendar',
      zap: 'flash',
    };
    return iconMap[icon] || 'trophy';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name={Icons.arrowLeft} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Summary */}
      <View style={styles.summaryCard}>
        <LinearGradient colors={['#F97316', '#EA580C']} style={styles.summaryGradient} />
        <View style={styles.summaryContent}>
          <Icon name={Icons.trophy} size={40} color="#fff" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryValue}>{unlockedCount}/{badges.length}</Text>
            <Text style={styles.summaryLabel}>Badges Unlocked</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Unlocked Badges */}
        {badges.filter(b => b.unlockedAt).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unlocked</Text>
            <View style={styles.badgeGrid}>
              {badges.filter(b => b.unlockedAt).map((badge) => (
                <View key={badge.id} style={styles.badgeCardUnlocked}>
                  <View style={styles.badgeIconUnlocked}>
                    <Icon name={getIconName(badge.icon) as any} size={28} color="#F97316" />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                  <Text style={styles.badgeDate}>
                    {new Date(badge.unlockedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Locked Badges */}
        {badges.filter(b => !b.unlockedAt).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locked</Text>
            <View style={styles.badgeGrid}>
              {badges.filter(b => !b.unlockedAt).map((badge) => (
                <View key={badge.id} style={styles.badgeCardLocked}>
                  <View style={styles.badgeIconLocked}>
                    <Icon name={getIconName(badge.icon) as any} size={28} color="#52525B" />
                  </View>
                  <Text style={styles.badgeNameLocked}>{badge.name}</Text>
                  <Text style={styles.badgeDescLocked}>{badge.description}</Text>
                  <Text style={styles.badgeRequirement}>
                    {badge.type === 'sessions' && `${badge.requirement} workouts`}
                    {badge.type === 'streak' && `${badge.requirement} day streak`}
                    {badge.type === 'prs' && `${badge.requirement} PRs`}
                    {badge.type === 'consistency' && `${badge.requirement} weeks`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {badges.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name={Icons.trophy} size={48} color="#3F3F46" />
            <Text style={styles.emptyTitle}>No Badges Yet</Text>
            <Text style={styles.emptyDesc}>Complete workouts to earn achievements</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  summaryCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  summaryGradient: { padding: 20 },
  summaryContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryText: { flex: 1 },
  summaryValue: { fontSize: 32, fontWeight: '700', color: '#fff' },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCardUnlocked: { width: '47%', backgroundColor: '#18181B', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F97316' },
  badgeIconUnlocked: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(249, 115, 22, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  badgeName: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: '#71717A', textAlign: 'center', marginTop: 4 },
  badgeDate: { fontSize: 10, color: '#F97316', marginTop: 8 },
  badgeCardLocked: { width: '47%', backgroundColor: '#18181B', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#27272A', opacity: 0.6 },
  badgeIconLocked: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  badgeNameLocked: { fontSize: 14, fontWeight: '600', color: '#71717A', textAlign: 'center' },
  badgeDescLocked: { fontSize: 11, color: '#52525B', textAlign: 'center', marginTop: 4 },
  badgeRequirement: { fontSize: 10, color: '#52525B', marginTop: 8 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#71717A', marginTop: 4 },
});