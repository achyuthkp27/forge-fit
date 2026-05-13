import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Icon, Icons } from './Icon';

interface PlateCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PlateCalculatorModal({ visible, onClose }: PlateCalculatorModalProps) {
  const [targetWeight, setTargetWeight] = useState(135);
  const [barWeight, setBarWeight] = useState(45);

  const calculatePlates = (target: number, bar: number) => {
    const weightPerSide = (target - bar) / 2;
    const availablePlates = [45, 35, 25, 10, 5, 2.5];
    const plates: number[] = [];
    let remaining = weightPerSide;

    for (const plate of availablePlates) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
      }
    }
    return { platesPerSide: plates, totalWeight: target };
  };

  const getPlateColor = (weight: number): string => {
    switch (weight) {
      case 45: return '#EF4444';
      case 35: return '#F97316';
      case 25: return '#22C55E';
      case 10: return '#3B82F6';
      case 5: return '#EAB308';
      case 2.5: return '#71717A';
      default: return '#71717A';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Plate Calculator</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name={Icons.x} size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
          <View style={styles.plateInputRow}>
            <View style={styles.plateInputGroup}>
              <Text style={styles.plateLabel}>Target Weight</Text>
              <TextInput
                style={styles.plateInput}
                value={targetWeight.toString()}
                onChangeText={(t) => setTargetWeight(parseInt(t) || 0)}
                keyboardType="numeric"
              />
              <Text style={styles.plateUnit}>lbs</Text>
            </View>
            <View style={styles.plateInputGroup}>
              <Text style={styles.plateLabel}>Bar Weight</Text>
              <TextInput
                style={styles.plateInput}
                value={barWeight.toString()}
                onChangeText={(t) => setBarWeight(parseInt(t) || 0)}
                keyboardType="numeric"
              />
              <Text style={styles.plateUnit}>lbs</Text>
            </View>
          </View>
          {targetWeight >= barWeight ? (
            <View style={styles.plateResult}>
              <Text style={styles.plateResultTitle}>Plates per side:</Text>
              <View style={styles.plateList}>
                {calculatePlates(targetWeight, barWeight).platesPerSide.map((plate, i) => (
                  <View key={i} style={[styles.plateItem, { backgroundColor: getPlateColor(plate) }]}>
                    <Text style={styles.plateItemText}>{plate}</Text>
                  </View>
                ))}
              </View>
              {calculatePlates(targetWeight, barWeight).platesPerSide.length === 0 && (
                <Text style={styles.noPlatesText}>Just the bar!</Text>
              )}
            </View>
          ) : (
            <Text style={styles.errorText}>Target must be at least bar weight</Text>
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
  plateInputRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  plateInputGroup: { flex: 1 },
  plateLabel: { fontSize: 12, color: '#71717A', marginBottom: 6 },
  plateInput: { backgroundColor: '#27272A', borderRadius: 10, padding: 14, color: '#fff', fontSize: 18, textAlign: 'center' },
  plateUnit: { fontSize: 12, color: '#71717A', textAlign: 'center', marginTop: 6 },
  plateResult: { backgroundColor: '#18181B', borderRadius: 12, padding: 16 },
  plateResultTitle: { fontSize: 14, color: '#71717A', marginBottom: 12 },
  plateList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  plateItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  plateItemText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  noPlatesText: { fontSize: 14, color: '#71717A', textAlign: 'center' },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center' },
});
