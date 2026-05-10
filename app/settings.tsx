import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Share, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useWorkoutStore } from '../stores/workoutStore';
import { Icon, Icons } from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { LocalLLMSettings } from '../components/LocalLLMSettings';

export default function Settings() {
  const { settings, updateSettings, sessions, personalRecords, workouts, exercises } = useWorkoutStore();
  const [notifications, setNotifications] = useState({ workoutReminders: true, prAlerts: true, weeklySummary: false });
  const [isExporting, setIsExporting] = useState(false);
  const [localLLMConnected, setLocalLLMConnected] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        settings,
        sessions: sessions.map(s => ({ ...s, startTime: s.startTime.toISOString(), endTime: s.endTime?.toISOString() })),
        personalRecords: personalRecords.map(pr => ({ ...pr, date: pr.date.toISOString() })),
        workouts,
        exercises: exercises.filter(e => e.isCustom),
      };
      const jsonString = JSON.stringify(data, null, 2);
      if (Platform.OS === 'ios') {
        await Share.share({ message: jsonString });
      } else {
        Alert.alert('Export', 'Data copied to clipboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
    setIsExporting(false);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will delete all workout sessions, PRs, and custom exercises. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'History cleared');
        }},
      ]
    );
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Coach</Text>
          <LocalLLMSettings onConnectionChange={setLocalLLMConnected} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>FF</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Fitness Enthusiast</Text>
              <Text style={styles.profileLevel}>{settings.experienceLevel} level</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name={Icons.dumbbell} size={20} color="#F97316" />
              <View>
                <Text style={styles.settingLabel}>Unit</Text>
                <Text style={styles.settingValue}>{settings.unit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}</Text>
              </View>
            </View>
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={[styles.toggleButton, settings.unit === 'kg' && styles.toggleButtonActive]} onPress={() => updateSettings({ unit: 'kg' })}>
                <Text style={[styles.toggleText, settings.unit === 'kg' && styles.toggleTextActive]}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, settings.unit === 'lb' && styles.toggleButtonActive]} onPress={() => updateSettings({ unit: 'lb' })}>
                <Text style={[styles.toggleText, settings.unit === 'lb' && styles.toggleTextActive]}>lb</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name={Icons.lightbulb} size={20} color="#F97316" />
              <View>
                <Text style={styles.settingLabel}>Theme</Text>
                <Text style={styles.settingValue}>{settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
              </View>
            </View>
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={[styles.toggleButton, settings.theme === 'dark' && styles.toggleButtonActive]} onPress={() => updateSettings({ theme: 'dark' })}>
                <Text style={[styles.toggleText, settings.theme === 'dark' && styles.toggleTextActive]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleButton, settings.theme === 'light' && styles.toggleButtonActive]} onPress={() => updateSettings({ theme: 'light' })}>
                <Text style={[styles.toggleText, settings.theme === 'light' && styles.toggleTextActive]}>Light</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name={Icons.bell} size={20} color="#F97316" />
              <Text style={styles.settingLabel}>Workout Reminders</Text>
            </View>
            <Switch value={notifications.workoutReminders} onValueChange={() => toggleNotification('workoutReminders')} trackColor={{ false: '#27272A', true: '#F97316' }} thumbColor="#fff" />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name={Icons.trophy} size={20} color="#F97316" />
              <Text style={styles.settingLabel}>PR Alerts</Text>
            </View>
            <Switch value={notifications.prAlerts} onValueChange={() => toggleNotification('prAlerts')} trackColor={{ false: '#27272A', true: '#F97316' }} thumbColor="#fff" />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name={Icons.calendar} size={20} color="#F97316" />
              <Text style={styles.settingLabel}>Weekly Summary</Text>
            </View>
            <Switch value={notifications.weeklySummary} onValueChange={() => toggleNotification('weeklySummary')} trackColor={{ false: '#27272A', true: '#F97316' }} thumbColor="#fff" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.goalsContainer}>
            {settings.goals.map((goal, index) => (
              <View key={index} style={styles.goalTag}>
                <Text style={styles.goalText}>{goal}</Text>
                <TouchableOpacity onPress={() => updateSettings({ goals: settings.goals.filter((_, i) => i !== index) })}>
                  <Icon name={Icons.x} size={14} color="#71717A" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addGoalButton} onPress={() => Alert.prompt?.('Add Goal', 'Enter your fitness goal', (text) => { if (text) updateSettings({ goals: [...settings.goals, text] }); })}>
              <Icon name={Icons.plus} size={16} color="#F97316" />
              <Text style={styles.addGoalText}>Add Goal</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <View style={styles.experienceSelector}>
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <TouchableOpacity key={level} style={[styles.expButton, settings.experienceLevel === level && styles.expButtonActive]} onPress={() => updateSettings({ experienceLevel: level as any })}>
                <Text style={[styles.expText, settings.experienceLevel === level && styles.expTextActive]}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
            <Icon name={Icons.download} size={20} color="#A1A1AA" />
            <Text style={styles.menuText}>Export Data</Text>
            <Icon name={Icons.chevronRight} size={16} color="#52525B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Import Data', 'Import functionality coming soon')}>
            <Icon name={Icons.upload} size={20} color="#A1A1AA" />
            <Text style={styles.menuText}>Import Data</Text>
            <Icon name={Icons.chevronRight} size={16} color="#52525B" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={handleClearHistory}>
            <Icon name={Icons.trash} size={20} color="#EF4444" />
            <Text style={styles.dangerText}>Clear History</Text>
            <Icon name={Icons.chevronRight} size={16} color="#52525B" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutInfo}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutText}>ForgeFit</Text>
              <Text style={styles.versionBadge}>v1.0.0</Text>
            </View>
            <Text style={styles.aboutSubtext}>Your AI-powered workout companion</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{sessions.length}</Text><Text style={styles.statLabel}>Workouts</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{personalRecords.length}</Text><Text style={styles.statLabel}>PRs</Text></View>
              <View style={styles.statItem}><Text style={styles.statValue}>{exercises.filter(e => e.isCustom).length}</Text><Text style={styles.statLabel}>Custom</Text></View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#71717A', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', padding: 16, borderRadius: 16, gap: 16, borderWidth: 1, borderColor: '#27272A' },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  profileLevel: { fontSize: 14, color: '#71717A', textTransform: 'capitalize' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#18181B', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#27272A' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  settingValue: { fontSize: 13, color: '#71717A' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#0D0D0D', borderRadius: 8, padding: 2 },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  toggleButtonActive: { backgroundColor: '#F97316' },
  toggleText: { fontSize: 14, color: '#71717A', fontWeight: '500' },
  toggleTextActive: { color: '#fff' },
  goalsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: '#27272A' },
  goalText: { fontSize: 14, color: '#fff' },
  addGoalButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#F97316', borderStyle: 'dashed', alignSelf: 'flex-start' },
  addGoalText: { fontSize: 14, color: '#F97316', fontWeight: '500' },
  experienceSelector: { flexDirection: 'row', gap: 8 },
  expButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', alignItems: 'center' },
  expButtonActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  expText: { fontSize: 14, color: '#71717A', fontWeight: '500' },
  expTextActive: { color: '#fff' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#27272A', gap: 12 },
  menuText: { flex: 1, fontSize: 16, color: '#fff' },
  dangerItem: { borderColor: '#EF444430' },
  dangerText: { flex: 1, fontSize: 16, color: '#EF4444' },
  aboutInfo: { backgroundColor: '#18181B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272A' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  aboutText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  versionBadge: { fontSize: 12, color: '#F97316', backgroundColor: '#F9731620', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  aboutSubtext: { fontSize: 13, color: '#71717A', marginBottom: 16 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#27272A', paddingTop: 12, marginTop: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#F97316' },
  statLabel: { fontSize: 12, color: '#71717A', marginTop: 2 },
});