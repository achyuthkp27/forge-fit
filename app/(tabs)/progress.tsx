import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, Alert, Modal, Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '../../stores/workoutStore';
import { Icon, Icons } from '../../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise, SetLog, WorkoutSession } from '../../types';

const { width } = Dimensions.get('window');

export default function Progress() {
  const router = useRouter();
  const { 
    personalRecords, 
    sessions, 
    exercises, 
    settings, 
    updateSettings,
    bodyMeasurements,
    loadBodyMeasurements,
    saveBodyMeasurements,
    sleepHistory,
    loadSleepHistory,
    saveSleepHistory
  } = useWorkoutStore();
  
  const [showOneRM, setShowOneRM] = useState(false);
  const [oneRMWeight, setOneRMWeight] = useState('');
  const [oneRMReps, setOneRMReps] = useState('');
  const [bodyWeight, setBodyWeight] = useState(settings.bodyWeight?.toString() || '75');
  const [showBodyTracker, setShowBodyTracker] = useState(false);

  // Body Measurements
  const [showBodyMeasurements, setShowBodyMeasurements] = useState(false);
  const [bodyMeasurementsLocal, setBodyMeasurementsLocal] = useState({
    chest: '', waist: '', hips: '', arms: '', thighs: '',
  });

  // Sleep & Energy Tracking
  const [showSleepTracker, setShowSleepTracker] = useState(false);
  const [sleepHours, setSleepHours] = useState('7');
  const [energyLevel, setEnergyLevel] = useState('5');
  const [localSleepHistory, setLocalSleepHistory] = useState<{ date: string; hours: number; quality: number }[]>([]);

  useEffect(() => {
    loadBodyMeasurements();
    loadSleepHistory();
  }, []);

  useEffect(() => {
    if (settings.bodyWeight) {
      setBodyWeight(settings.bodyWeight.toString());
    }
  }, [settings.bodyWeight]);

  useEffect(() => {
    if (bodyMeasurements && bodyMeasurements.length > 0) {
      const latest = bodyMeasurements[bodyMeasurements.length - 1];
      setBodyMeasurementsLocal({
        chest: latest.chest?.toString() || '',
        waist: latest.waist?.toString() || '',
        hips: latest.hips?.toString() || '',
        arms: latest.arms?.toString() || '',
        thighs: latest.thighs?.toString() || '',
      });
    }
  }, [bodyMeasurements]);

  useEffect(() => {
    if (sleepHistory) {
      setLocalSleepHistory(sleepHistory.map(s => ({ date: s.date, hours: s.hours, quality: s.quality })));
    }
  }, [sleepHistory]);

  const handleSaveBodyWeight = () => {
    const weight = parseFloat(bodyWeight);
    if (!isNaN(weight) && weight > 0) {
      updateSettings({ bodyWeight: weight });
      Alert.alert('Saved', `Body weight updated to ${weight} ${settings.unit}`);
      setShowBodyTracker(false);
    }
  };

  const calculateOneRM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const volumeData = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekSessions = sessions.filter((s: WorkoutSession) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= weekStart && sessionDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      });
      const volume = weekSessions.reduce((acc: number, session: WorkoutSession) => {
        return acc + session.sets.reduce((sum: number, set: SetLog) => sum + (set.weight * set.reps), 0);
      }, 0);
      weeks.push({ label: `W${4 - i}`, volume: volume / 1000 });
    }
    return weeks;
  }, [sessions]);

  const muscleBalance = useMemo(() => {
    const muscleGroups: Record<string, number> = {};
    const recentSessions = sessions.slice(-10);
    let totalSets = 0;

    recentSessions.forEach((session: WorkoutSession) => {
      session.sets.forEach((set: SetLog) => {
        const exercise = exercises.find((e: Exercise) => e.id === set.exerciseId);
        if (exercise) {
          exercise.muscleGroups.forEach((m: string) => {
            muscleGroups[m] = (muscleGroups[m] || 0) + 1;
            totalSets++;
          });
        }
      });
    });

    if (totalSets === 0) return [];
    return Object.entries(muscleGroups)
      .map(([muscle, count]) => ({ muscle, percentage: Math.round((count / totalSets) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }, [sessions, exercises]);

  const weeklyLoad = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = sessions.filter((s: WorkoutSession) => new Date(s.startTime) >= oneWeekAgo);
    const lastWeekSessions = sessions.filter((s: WorkoutSession) => new Date(s.startTime) >= twoWeeksAgo && new Date(s.startTime) < oneWeekAgo);

    const calcVolume = (sessionList: WorkoutSession[]) => sessionList.reduce((acc, s) => acc + s.sets.reduce((sum: number, set: SetLog) => sum + (set.weight * set.reps), 0), 0);

    return {
      thisWeek: calcVolume(thisWeekSessions) / 1000,
      lastWeek: calcVolume(lastWeekSessions) / 1000,
    };
  }, [sessions]);

  const handleSaveSleep = async () => {
    const hours = parseFloat(sleepHours);
    const quality = parseInt(energyLevel);
    if (!isNaN(hours) && hours > 0 && quality >= 1 && quality <= 10) {
      const today = new Date().toISOString().split('T')[0];
      await saveSleepHistory({ id: Date.now().toString(), date: today, hours, quality });
      Alert.alert('Logged Successfully', `Sleep: ${hours}h, Quality: ${quality}/10`);
      setShowSleepTracker(false);
    }
  };

  const handleSaveMeasurements = async () => {
    const measurements = Object.entries(bodyMeasurementsLocal).reduce((acc, [key, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) acc[key as keyof typeof acc] = num;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(measurements).length > 0) {
      await saveBodyMeasurements({ id: Date.now().toString(), date: new Date().toISOString(), ...measurements });
      Alert.alert('Saved', 'Body measurements updated');
      setShowBodyMeasurements(false);
    }
  };

  const exportToCSV = () => {
    try {
      let csvContent = 'Type,Date,Details,Value\n';
      sessions.forEach((session: any) => {
        csvContent += `Session,${new Date(session.startTime).toLocaleDateString()},${session.workoutName},"${session.sets.length} sets"\n`;
      });
      personalRecords.forEach((pr: any) => {
        csvContent += `PR,${new Date(pr.date).toLocaleDateString()},${pr.exerciseName},"${pr.maxWeight}kg x ${pr.maxReps}"\n`;
      });
      if (settings.bodyWeight) {
        csvContent += `Body Weight,Today,Current,"${settings.bodyWeight} ${settings.unit}"\n`;
      }
      Clipboard.setString(csvContent);
      Alert.alert('Copied to Clipboard', 'CSV data has been copied. Paste into Excel or a text editor to save.');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const heatmapData = useMemo(() => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 27);
    for (let i = 27; i >= 0; i--) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const daySessions = sessions.filter(s => new Date(s.startTime).toDateString() === date.toDateString());
      const dayVolume = daySessions.reduce((acc, session) => acc + session.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0), 0);
      const intensity = dayVolume > 0 ? Math.min(1, dayVolume / 10000) : 0;
      days.push({ date, intensity, dayOfWeek: date.getDay() });
    }
    return days;
  }, [sessions]);



  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'rgba(255,255,255,0.03)';
    if (intensity < 0.3) return 'rgba(249, 115, 22, 0.3)';
    if (intensity < 0.6) return 'rgba(249, 115, 22, 0.6)';
    return '#F97316';
  };

  const maxVolume = Math.max(...volumeData.map(v => v.volume)) || 1;

  const getMonthLabel = () => {
    const now = new Date();
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(now.getDate() - 27);
    return `${fourWeeksAgo.toLocaleString('default', { month: 'short' })} - ${now.toLocaleString('default', { month: 'short' })}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerBtn} onPress={exportToCSV}>
              <Icon name={Icons.download} size={20} color="#A1A1AA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/history')}>
              <Icon name={Icons.clock} size={20} color="#A1A1AA" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconBadge}><Icon name={Icons.activity} size={16} color="#F97316" /></View>
            <Text style={styles.statValue}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}><Icon name={Icons.trophy} size={16} color="#22C55E" /></View>
            <Text style={styles.statValue}>{personalRecords.length}</Text>
            <Text style={styles.statLabel}>Records Set</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(167, 139, 250, 0.1)' }]}><Icon name={Icons.flame} size={16} color="#A78BFA" /></View>
            <Text style={styles.statValue}>{weeklyLoad.thisWeek.toFixed(1)}<Text style={{fontSize: 14, color: '#A1A1AA'}}>t</Text></Text>
            <Text style={styles.statLabel}>Weekly Volume</Text>
          </View>
        </View>

        {/* Heatmap */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Icon name={Icons.calendar} size={18} color="#F97316" />
            <Text style={styles.cardTitle}>28-Day Consistency</Text>
            <Text style={styles.cardMeta}>{getMonthLabel()}</Text>
          </View>
          <View style={styles.heatmapContainer}>
            <View style={styles.dayLabels}>
              {['S','M','T','W','T','F','S'].map((d, i) => <Text key={i} style={styles.dayLabelText}>{d}</Text>)}
            </View>
            <View style={styles.heatmapGrid}>
              {heatmapData.map((day, index) => (
                <View key={index} style={[styles.heatmapDay, { backgroundColor: getIntensityColor(day.intensity) }]} />
              ))}
            </View>
          </View>
        </View>

        {/* Volume Trend & Muscle Balance Row */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Icon name={Icons.trendingUp} size={18} color="#F97316" />
            <Text style={styles.cardTitle}>Volume Trend</Text>
          </View>
          <View style={styles.chartContainer}>
            {volumeData.map((week, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max(4, (week.volume / maxVolume) * 100)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{week.label}</Text>
                <Text style={styles.barValue}>{week.volume > 0 ? week.volume.toFixed(1) + 't' : '0'}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Icon name={Icons.activity} size={18} color="#F97316" />
            <Text style={styles.cardTitle}>Muscle Balance</Text>
          </View>
          {muscleBalance.length === 0 ? (
            <Text style={styles.emptyCardText}>Complete workouts to see your distribution.</Text>
          ) : (
            <View style={styles.muscleList}>
              {muscleBalance.map((item, index) => (
                <View key={index} style={styles.muscleRow}>
                  <View style={styles.muscleLabelRow}>
                    <Text style={styles.muscleName}>{item.muscle}</Text>
                    <Text style={styles.musclePercent}>{item.percentage}%</Text>
                  </View>
                  <View style={styles.muscleTrack}>
                    <View style={[styles.muscleFill, { width: `${item.percentage}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Tools */}
        <Text style={styles.sectionHeading}>Calculators & Tracking</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBlock} onPress={() => setShowOneRM(true)}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}><Icon name={Icons.calculator} size={24} color="#F97316" /></View>
            <Text style={styles.actionTitle}>1RM Calc</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBlock} onPress={() => setShowBodyTracker(true)}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}><Icon name={Icons.user} size={24} color="#8B5CF6" /></View>
            <Text style={styles.actionTitle}>Body Weight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBlock} onPress={() => setShowSleepTracker(true)}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}><Icon name={Icons.moon} size={24} color="#38BDF8" /></View>
            <Text style={styles.actionTitle}>Sleep Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBlock} onPress={() => setShowBodyMeasurements(true)}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}><Icon name={Icons.target} size={24} color="#22C55E" /></View>
            <Text style={styles.actionTitle}>Measure</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* 1RM Modal */}
      <Modal visible={showOneRM} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOneRM(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>1RM Estimator</Text>
              <TouchableOpacity onPress={() => setShowOneRM(false)}><Icon name={Icons.x} size={24} color="#A1A1AA" /></TouchableOpacity>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight ({settings.unit})</Text>
                <TextInput style={styles.inputField} value={oneRMWeight} onChangeText={setOneRMWeight} keyboardType="numeric" placeholder="0" placeholderTextColor="#52525B" />
              </View>
              <Text style={styles.inputMultiply}>×</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput style={styles.inputField} value={oneRMReps} onChangeText={setOneRMReps} keyboardType="numeric" placeholder="0" placeholderTextColor="#52525B" />
              </View>
            </View>
            {oneRMWeight && oneRMReps && (
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Estimated 1 Rep Max</Text>
                <Text style={styles.resultValue}>{calculateOneRM(parseFloat(oneRMWeight), parseInt(oneRMReps))} <Text style={styles.resultUnit}>{settings.unit}</Text></Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Body Weight Modal */}
      <Modal visible={showBodyTracker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBodyTracker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Body Weight</Text>
              <TouchableOpacity onPress={() => setShowBodyTracker(false)}><Icon name={Icons.x} size={24} color="#A1A1AA" /></TouchableOpacity>
            </View>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>Current Weight</Text>
              <View style={styles.inputWithUnit}>
                <TextInput style={styles.inputFieldLarge} value={bodyWeight} onChangeText={setBodyWeight} keyboardType="numeric" />
                <Text style={styles.unitText}>{settings.unit}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveBodyWeight}>
              <Text style={styles.primaryButtonText}>Save Log</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sleep Tracker Modal */}
      <Modal visible={showSleepTracker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSleepTracker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recovery Log</Text>
              <TouchableOpacity onPress={() => setShowSleepTracker(false)}><Icon name={Icons.x} size={24} color="#A1A1AA" /></TouchableOpacity>
            </View>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>Hours Slept</Text>
              <View style={styles.inputWithUnit}>
                <TextInput style={styles.inputFieldLarge} value={sleepHours} onChangeText={setSleepHours} keyboardType="numeric" />
                <Text style={styles.unitText}>hrs</Text>
              </View>
            </View>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>Energy Level (1-10)</Text>
              <View style={styles.inputWithUnit}>
                <TextInput style={styles.inputFieldLarge} value={energyLevel} onChangeText={setEnergyLevel} keyboardType="numeric" />
                <Text style={styles.unitText}>/ 10</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveSleep}>
              <Text style={styles.primaryButtonText}>Save Recovery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Body Measurements Modal */}
      <Modal visible={showBodyMeasurements} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowBodyMeasurements(false)}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Body Measurements</Text>
              <TouchableOpacity onPress={() => setShowBodyMeasurements(false)}><Icon name={Icons.x} size={24} color="#A1A1AA" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {['chest', 'waist', 'hips', 'arms', 'thighs'].map(part => (
                <View key={part} style={styles.inputGroupFull}>
                  <Text style={styles.inputLabel}>{part.charAt(0).toUpperCase() + part.slice(1)}</Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput 
                      style={styles.inputFieldLarge} 
                      value={bodyMeasurementsLocal[part as keyof typeof bodyMeasurementsLocal]} 
                      onChangeText={(v) => setBodyMeasurementsLocal(prev => ({ ...prev, [part]: v }))} 
                      keyboardType="numeric" 
                      placeholder="0.0"
                      placeholderTextColor="#52525B"
                    />
                    <Text style={styles.unitText}>cm</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 16, marginBottom: 40 }]} onPress={handleSaveMeasurements}>
                <Text style={styles.primaryButtonText}>Save Measurements</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerButtons: { flexDirection: 'row', gap: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#18181B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  // Quick Stats
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', alignItems: 'flex-start' },
  statIconBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(249, 115, 22, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#A1A1AA', fontWeight: '500' },
  
  // Premium Cards
  premiumCard: { backgroundColor: '#18181B', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  cardMeta: { fontSize: 12, color: '#71717A', fontWeight: '500' },
  emptyCardText: { color: '#71717A', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  
  // Heatmap
  heatmapContainer: { flexDirection: 'row' },
  dayLabels: { justifyContent: 'space-between', paddingRight: 10, paddingVertical: 2 },
  dayLabelText: { fontSize: 10, color: '#71717A', fontWeight: '600' },
  heatmapGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  heatmapDay: { width: `${100/7 - 2}%`, aspectRatio: 1, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.03)' },
  
  // Volume Trend
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 20 },
  barColumn: { alignItems: 'center', width: 40 },
  barTrack: { width: 30, height: 100, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 8 },
  barFill: { width: '100%', backgroundColor: '#F97316', borderRadius: 6 },
  barLabel: { fontSize: 12, color: '#A1A1AA', fontWeight: '600', marginBottom: 2 },
  barValue: { fontSize: 10, color: '#71717A' },
  
  // Muscle Balance
  muscleList: { gap: 16 },
  muscleRow: { width: '100%' },
  muscleLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  muscleName: { fontSize: 13, color: '#E4E4E7', fontWeight: '500', textTransform: 'capitalize' },
  musclePercent: { fontSize: 13, color: '#F97316', fontWeight: '600' },
  muscleTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  muscleFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 3 },
  
  // Action Grid
  sectionHeading: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 16, marginTop: 10, paddingHorizontal: 4 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionBlock: { width: '48%', backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 14, color: '#E4E4E7', fontWeight: '500' },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  inputGroup: { flex: 1 },
  inputGroupFull: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#A1A1AA', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputField: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 20, fontWeight: '600', textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputFieldLarge: { flex: 1, paddingVertical: 14, color: '#fff', fontSize: 24, fontWeight: '700' },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  unitText: { fontSize: 16, color: '#71717A', fontWeight: '600', marginLeft: 8 },
  inputMultiply: { fontSize: 24, color: '#71717A', marginHorizontal: 16, marginTop: 24 },
  resultBox: { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.2)' },
  resultLabel: { fontSize: 13, color: '#F97316', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
  resultUnit: { fontSize: 18, color: '#A1A1AA', fontWeight: '600' },
  primaryButton: { backgroundColor: '#F97316', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});