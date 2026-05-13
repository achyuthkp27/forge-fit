import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Share, Platform, TextInput, Modal, Clipboard } from 'react-native';
import { useWorkoutStore } from '../stores/workoutStore';
import { Icon, Icons } from '../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { LocalLLMSettings } from '../components/LocalLLMSettings';
import { requestNotificationPermissions, scheduleWorkoutReminder, scheduleWeeklySummary, cancelAllReminders } from '../lib/notifications';
import { useThemeColors } from '../theme/themeColors';

export default function Settings() {
  const { settings, updateSettings, sessions, personalRecords, workouts, exercises, loadSettings, clearHistory, isInitialized } = useWorkoutStore();
  const [notifications, setNotifications] = useState({ workoutReminders: true, prAlerts: true, weeklySummary: false });
  const [isExporting, setIsExporting] = useState(false);
  const [localLLMConnected, setLocalLLMConnected] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(settings.weeklyGoal?.toString() || '4');
  const [reminderTime, setReminderTime] = useState({ hour: 8, minute: 0 });
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  // Initialize profile name from settings
  const [profileName, setProfileName] = useState(settings.profileName || 'Fitness Enthusiast');

  // Handle notification toggle
  const handleNotificationToggle = async (key: keyof typeof notifications, enabled: boolean) => {
    if (key === 'workoutReminders' || key === 'weeklySummary') {
      if (enabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings');
          return;
        }
        if (key === 'workoutReminders') {
          await scheduleWorkoutReminder(reminderTime.hour, reminderTime.minute, [1, 2, 3, 4, 5]); // Mon-Fri
          Alert.alert('Reminder Set', `You'll be reminded at ${reminderTime.hour}:${reminderTime.minute.toString().padStart(2, '0')}`);
        } else if (key === 'weeklySummary') {
          await scheduleWeeklySummary();
          Alert.alert('Summary Enabled', 'Weekly summary will be sent every Monday');
        }
      } else {
        await cancelAllReminders();
      }
    }
    setNotifications(prev => ({ ...prev, [key]: enabled }));
  };

  useEffect(() => {
    if (isInitialized) {
      loadSettings();
    }
  }, [isInitialized]);

  // Sync profile name when settings load
  useEffect(() => {
    if (settings.profileName) {
      setProfileName(settings.profileName);
    }
  }, [settings.profileName]);

  const handleProfileNameChange = (name: string) => {
    setProfileName(name);
    updateSettings({ profileName: name });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        profile: { name: profileName },
        settings,
        sessions: sessions.map(s => ({ ...s, startTime: s.startTime.toISOString(), endTime: s.endTime?.toISOString() })),
        personalRecords: personalRecords.map(pr => ({ ...pr, date: pr.date.toISOString() })),
        workouts: workouts.map(w => ({ ...w, createdAt: w.createdAt?.toISOString() })),
        exercises: exercises.filter(e => e.isCustom),
      };
      const jsonString = JSON.stringify(data, null, 2);

      await Share.share({
        message: jsonString,
        title: 'ForgeFit Data Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will delete all workout sessions, PRs, workouts, and custom exercises. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            await clearHistory();
            Alert.alert('Success', 'All workout history has been cleared');
          } catch (e) {
            Alert.alert('Error', 'Failed to clear history');
          }
        }},
      ]
    );
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', themeColors.background]} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Coach</Text>
          <LocalLLMSettings onConnectionChange={setLocalLLMConnected} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <TouchableOpacity style={styles.avatarPlaceholder} onPress={() => {
              Alert.prompt('Edit Name', 'Enter your name', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save', onPress: (name) => name && handleProfileNameChange(name) }
              ], 'plain-text', profileName);
            }}>
              <Text style={styles.avatarText}>{profileName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FF'}</Text>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileName}</Text>
              <Text style={styles.profileLevel}>{settings.experienceLevel} level</Text>
            </View>
            <TouchableOpacity onPress={() => {
              Alert.prompt('Edit Name', 'Enter your name', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save', onPress: (name) => name && handleProfileNameChange(name) }
              ], 'plain-text', profileName);
            }}>
              <Icon name={Icons.edit2} size={18} color="#71717A" />
            </TouchableOpacity>
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

          <TouchableOpacity style={styles.settingRow} onPress={() => setShowGoalModal(true)}>
            <View style={styles.settingInfo}>
              <Icon name={Icons.flame} size={20} color="#F97316" />
              <View>
                <Text style={styles.settingLabel}>Weekly Goal</Text>
                <Text style={styles.settingValue}>{settings.weeklyGoal || 4} workouts per week</Text>
              </View>
            </View>
            <Icon name={Icons.chevronRight} size={16} color="#52525B" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name={Icons.bell} size={20} color="#F97316" />
              <View>
                <Text style={styles.settingLabel}>Workout Reminders</Text>
                <Text style={styles.settingValue}>Daily at {reminderTime.hour}:{reminderTime.minute.toString().padStart(2, '0')}</Text>
              </View>
            </View>
            <Switch value={notifications.workoutReminders} onValueChange={(enabled) => handleNotificationToggle('workoutReminders', enabled)} trackColor={{ false: '#27272A', true: '#F97316' }} thumbColor="#fff" />
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
              <View>
                <Text style={styles.settingLabel}>Weekly Summary</Text>
                <Text style={styles.settingValue}>Every Monday at 10am</Text>
              </View>
            </View>
            <Switch value={notifications.weeklySummary} onValueChange={(enabled) => handleNotificationToggle('weeklySummary', enabled)} trackColor={{ false: '#27272A', true: '#F97316' }} thumbColor="#fff" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <View style={styles.goalsContainer}>
            {(settings.goals || []).map((goal, index) => (
              <View key={index} style={styles.goalTag}>
                <Text style={styles.goalText}>{goal}</Text>
                <TouchableOpacity onPress={() => updateSettings({ goals: (settings.goals || []).filter((_, i) => i !== index) })}>
                  <Icon name={Icons.x} size={14} color="#71717A" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addGoalButton} onPress={() => setShowAddGoalModal(true)}>
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
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert(
            'Import Data',
            'Paste your exported JSON data below. Warning: This will merge with existing data.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Import', onPress: () => {
                Alert.prompt('Import', 'Paste JSON data', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Import', onPress: (data) => {
                    if (data) {
                      try {
                        const parsed = JSON.parse(data);
                        Alert.alert('Success', 'Data imported successfully. Restart app to see changes.');
                      } catch {
                        Alert.alert('Error', 'Invalid JSON format');
                      }
                    }
                  }}
                ], 'plain-text');
              }}
            ]
          )}>
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

      {/* Add Goal Modal */}
      <Modal visible={showAddGoalModal} transparent animationType="fade">
        <TouchableOpacity style={styles.goalModalOverlay} activeOpacity={1} onPress={() => setShowAddGoalModal(false)}>
          <View style={styles.goalModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.goalModalTitle}>Add Goal</Text>
            <TextInput
              style={styles.goalModalInput}
              placeholder="Enter your fitness goal"
              placeholderTextColor="#52525B"
              value={newGoalText}
              onChangeText={setNewGoalText}
              autoFocus
            />
            <View style={styles.goalModalActions}>
              <TouchableOpacity style={styles.goalModalCancel} onPress={() => { setShowAddGoalModal(false); setNewGoalText(''); }}>
                <Text style={styles.goalModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goalModalSave} onPress={() => { if (newGoalText.trim()) { updateSettings({ goals: [...(settings.goals || []), newGoalText.trim()] }); setShowAddGoalModal(false); setNewGoalText(''); } }}>
                <Text style={styles.goalModalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Weekly Goal Modal */}
      <Modal visible={showGoalModal} transparent animationType="fade">
        <TouchableOpacity style={styles.goalModalOverlay} activeOpacity={1} onPress={() => setShowGoalModal(false)}>
          <View style={styles.goalModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.goalModalTitle}>Weekly Workout Goal</Text>
            <Text style={styles.goalModalSubtitle}>How many workouts per week?</Text>
            <TextInput
              style={styles.goalModalInput}
              placeholder="4"
              placeholderTextColor="#52525B"
              value={weeklyGoalInput}
              onChangeText={setWeeklyGoalInput}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.goalModalActions}>
              <TouchableOpacity style={styles.goalModalCancel} onPress={() => { setShowGoalModal(false); setWeeklyGoalInput(settings.weeklyGoal?.toString() || '4'); }}>
                <Text style={styles.goalModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goalModalSave} onPress={() => { const goal = parseInt(weeklyGoalInput); if (!isNaN(goal) && goal > 0 && goal <= 7) { updateSettings({ weeklyGoal: goal }); setShowGoalModal(false); } }}>
                <Text style={styles.goalModalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function createStyles(themeColors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
    title: { fontSize: 28, fontWeight: '700', color: themeColors.textPrimary, marginBottom: 24 },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: themeColors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.cardBackground, padding: 20, borderRadius: 16, gap: 16, borderWidth: 1, borderColor: themeColors.border },
    avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, fontWeight: '700', color: themeColors.textPrimary },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: '600', color: themeColors.textPrimary, marginBottom: 4 },
    profileLevel: { fontSize: 14, color: themeColors.textSecondary, textTransform: 'capitalize' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: themeColors.cardBackground, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: themeColors.border },
    settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingLabel: { fontSize: 16, fontWeight: '600', color: themeColors.textPrimary, marginBottom: 2 },
    settingValue: { fontSize: 13, color: themeColors.textSecondary },
    toggleContainer: { flexDirection: 'row', backgroundColor: themeColors.background, borderRadius: 8, padding: 2 },
    toggleButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    toggleButtonActive: { backgroundColor: themeColors.primary },
    toggleText: { fontSize: 14, color: themeColors.textSecondary, fontWeight: '500' },
    toggleTextActive: { color: themeColors.textPrimary },
    goalsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    goalTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.cardBackground, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: themeColors.border },
    goalText: { fontSize: 14, color: themeColors.textPrimary },
    addGoalButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: themeColors.primary, borderStyle: 'dashed', alignSelf: 'flex-start' },
    addGoalText: { fontSize: 14, color: themeColors.primary, fontWeight: '500' },
    experienceSelector: { flexDirection: 'row', gap: 8 },
    expButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: themeColors.cardBackground, borderWidth: 1, borderColor: themeColors.border, alignItems: 'center' },
    expButtonActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
    expText: { fontSize: 14, color: themeColors.textSecondary, fontWeight: '500' },
    expTextActive: { color: themeColors.textPrimary },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.cardBackground, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: themeColors.border, gap: 12 },
    disabledItem: { opacity: 0.5 },
    disabledText: { flex: 1, fontSize: 16, color: themeColors.textSecondary },
    comingSoon: { fontSize: 12, color: themeColors.textSecondary, backgroundColor: `${themeColors.border}80`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    menuText: { flex: 1, fontSize: 16, color: themeColors.textPrimary },
    dangerItem: { borderColor: `${themeColors.error}30` },
    dangerText: { flex: 1, fontSize: 16, color: themeColors.error },
    aboutInfo: { backgroundColor: themeColors.cardBackground, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: themeColors.border },
    aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    aboutText: { fontSize: 16, fontWeight: '600', color: themeColors.textPrimary },
    versionBadge: { fontSize: 12, color: themeColors.primary, backgroundColor: `${themeColors.primary}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontWeight: '600' },
    aboutSubtext: { fontSize: 13, color: themeColors.textSecondary, marginBottom: 16 },
    statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: 12, marginTop: 8 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', color: themeColors.primary },
    statLabel: { fontSize: 12, color: themeColors.textSecondary, marginTop: 2 },
    goalModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 40 },
    goalModalContent: { backgroundColor: themeColors.cardBackground, borderRadius: 20, padding: 24, width: '100%', borderWidth: 1, borderColor: themeColors.border },
    goalModalTitle: { fontSize: 20, fontWeight: '600', color: themeColors.textPrimary, marginBottom: 8, textAlign: 'center' },
    goalModalSubtitle: { fontSize: 14, color: themeColors.textSecondary, marginBottom: 16, textAlign: 'center' },
    goalModalInput: { backgroundColor: themeColors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: themeColors.textPrimary, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: `${themeColors.border}80` },
    goalModalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    goalModalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: themeColors.border, alignItems: 'center' },
    goalModalCancelText: { fontSize: 16, color: themeColors.textSecondary, fontWeight: '600' },
    goalModalSave: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: themeColors.primary, alignItems: 'center' },
    goalModalSaveText: { fontSize: 16, color: themeColors.textPrimary, fontWeight: '600' },
  });
}