import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Icon, Icons } from './Icon';

interface AIGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (goal: string) => Promise<void>;
}

export function AIGeneratorModal({ visible, onClose, onGenerate }: AIGeneratorModalProps) {
  const [aiGoal, setAiGoal] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!aiGoal.trim()) {
      Alert.alert('Error', 'Please enter a fitness goal');
      return;
    }
    setAiGenerating(true);
    await onGenerate(aiGoal);
    setAiGenerating(false);
    setAiGoal('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Workout Generator</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name={Icons.x} size={20} color="#71717A" />
            </TouchableOpacity>
          </View>
          <Text style={styles.aiSubtitle}>Describe your goal (e.g., "build chest", "leg strength", "full body")</Text>
          <TextInput
            style={styles.input}
            value={aiGoal}
            onChangeText={setAiGoal}
            placeholder="Enter your fitness goal..."
            placeholderTextColor="#52525B"
          />
          <TouchableOpacity
            style={[styles.generateBtn, aiGenerating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <Text style={styles.generateBtnText}>Generating...</Text>
            ) : (
              <>
                <Icon name={Icons.zap} size={18} color="#fff" />
                <Text style={styles.generateBtnText}>Generate Workout</Text>
              </>
            )}
          </TouchableOpacity>
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
  aiSubtitle: { fontSize: 14, color: '#71717A', marginBottom: 16 },
  input: { backgroundColor: '#18181B', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F97316', padding: 16, borderRadius: 12, marginTop: 16 },
  generateBtnDisabled: { backgroundColor: '#3F3F46' },
  generateBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
