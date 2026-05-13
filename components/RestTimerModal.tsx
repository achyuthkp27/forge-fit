import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Icon, Icons } from './Icon';

interface RestTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RestTimerModal({ visible, onClose }: RestTimerModalProps) {
  const [restRemaining, setRestRemaining] = useState(0);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerActive && endTime) {
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setRestRemaining(remaining);
        
        if (remaining === 0) {
          setTimerActive(false);
          setEndTime(null);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, endTime]);

  const startRestTimer = (seconds: number) => {
    setRestRemaining(seconds);
    setEndTime(Date.now() + seconds * 1000);
    setTimerActive(true);
  };

  const stopRestTimer = () => {
    setTimerActive(false);
    setRestRemaining(0);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClose = () => {
    stopRestTimer();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rest Timer</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name={Icons.x} size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerValue}>{Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>{timerActive ? 'Resting...' : 'Ready'}</Text>
          </View>
          {!timerActive ? (
            <View style={styles.timerPresets}>
              {[60, 90, 120, 180, 300].map(sec => (
                <TouchableOpacity key={sec} style={styles.timerPreset} onPress={() => startRestTimer(sec)}>
                  <Text style={styles.timerPresetText}>{sec < 60 ? `${sec}s` : `${sec / 60}m`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TouchableOpacity style={styles.stopTimerBtn} onPress={stopRestTimer}>
              <Text style={styles.stopTimerText}>Stop Timer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerModal: { backgroundColor: '#18181B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  timerDisplay: { alignItems: 'center', paddingVertical: 30 },
  timerValue: { fontSize: 64, fontWeight: '700', color: '#fff' },
  timerLabel: { fontSize: 16, color: '#71717A', marginTop: 8 },
  timerPresets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  timerPreset: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#27272A', borderRadius: 10 },
  timerPresetText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  stopTimerBtn: { backgroundColor: '#EF4444', padding: 16, borderRadius: 12, marginTop: 16 },
  stopTimerText: { fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center' },
});
