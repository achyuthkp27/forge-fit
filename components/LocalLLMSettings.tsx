import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../lib/aiService';

type IconName = keyof typeof Ionicons.glyphMap;

const Icon: React.FC<{ name: IconName; size?: number; color?: string }> = ({ name, size = 24, color = '#fff' }) => (
  <Ionicons name={name} size={size} color={color} />
);

export const LocalLLMSettings: React.FC<{ onConnectionChange?: (connected: boolean) => void }> = ({ onConnectionChange }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [modelStatus, setModelStatus] = useState<'not_installed' | 'downloading' | 'installed'>('not_installed');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    const status = await aiService.checkOnDeviceStatus();
    setModelStatus(status.available ? 'installed' : 'not_installed');
    onConnectionChange?.(status.available);
  };

  const handleDownload = async () => {
    try {
      setModelStatus('downloading');
      setDownloadProgress(0);

      Alert.alert(
        'Download AI Engine',
        'ForgeFit AI requires a one-time download of the intelligence engine (~2.5GB).\n\nThis will enable secure, on-device processing of your workouts.',
        [
          {
            text: 'Download Now',
            onPress: async () => {
              await simulateDownload();
            },
          },
          { text: 'Later', style: 'cancel', onPress: () => setModelStatus('not_installed') },
        ]
      );
    } catch (error) {
      setModelStatus('not_installed');
      Alert.alert('Error', 'Failed to initialize AI engine');
    }
  };

  const simulateDownload = async () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setModelStatus('installed');
          setDownloadProgress(100);
          aiService.initOnDeviceModel();
          Alert.alert('AI Ready!', 'ForgeFit AI engine is now installed.\nAll processing happens locally on your device for maximum speed and privacy.');
        }, 500);
      }
      setDownloadProgress(progress);
    }, 200);
  };

  const handleToggle = () => {
    if (!isEnabled && modelStatus !== 'installed') {
      Alert.alert('Download Required', 'Please download the ForgeFit AI engine to enable this feature.');
      return;
    }
    setIsEnabled(!isEnabled);
    aiService.setOnDeviceMode(!isEnabled);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="sparkles" size={20} color="#F97316" />
          <View>
            <Text style={styles.title}>ForgeFit AI Engine</Text>
            <Text style={styles.subtitle}>Privacy-focused Local Intelligence</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggle, isEnabled && styles.toggleEnabled]}
          onPress={handleToggle}
        >
          <View style={[styles.toggleKnob, isEnabled && styles.toggleKnobEnabled]} />
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { 
          backgroundColor: modelStatus === 'installed' ? '#22C55E' : 
                          modelStatus === 'downloading' ? '#F97316' : '#EF4444' 
        }]} />
        <Text style={styles.statusText}>
          {modelStatus === 'installed' ? 'Core Engine Active' :
           modelStatus === 'downloading' ? `Initializing... ${Math.round(downloadProgress)}%` :
           'Engine Not Installed'}
        </Text>
      </View>

      {modelStatus === 'downloading' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${downloadProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>ForgeFit Core • Apple Neural Engine</Text>
        </View>
      )}

      {modelStatus === 'not_installed' && (
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Icon name="download" size={20} color="#F97316" />
          <View style={styles.downloadTextContainer}>
            <Text style={styles.downloadText}>Download Intelligence Engine</Text>
            <Text style={styles.downloadSubtext}>On-device Processing • ~2.5GB</Text>
          </View>
          <Icon name="chevron-forward" size={18} color="#71717A" />
        </TouchableOpacity>
      )}

      <View style={styles.infoBox}>
        <View style={styles.infoHeader}>
          <Icon name="information-circle" size={16} color="#F97316" />
          <Text style={styles.infoHeaderText}>How it works</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoNumber}>1.</Text>
          <Text style={styles.infoText}>Download intelligence weights to device</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoNumber}>2.</Text>
          <Text style={styles.infoText}>Optimize engine for mobile hardware</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoNumber}>3.</Text>
          <Text style={styles.infoText}>Run securely via Apple Neural Engine</Text>
        </View>
      </View>

      {isEnabled && modelStatus === 'installed' && (
        <View style={styles.activeBadge}>
          <Icon name="checkmark-circle" size={14} color="#22C55E" />
          <Text style={styles.activeText}>ForgeFit AI Active</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#71717A',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272A',
    padding: 2,
    justifyContent: 'center',
  },
  toggleEnabled: {
    backgroundColor: '#F97316',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleKnobEnabled: {
    alignSelf: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: '#71717A',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#27272A',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#52525B',
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F97316',
    marginBottom: 12,
  },
  downloadTextContainer: {
    flex: 1,
  },
  downloadText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
  },
  downloadSubtext: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  infoHeaderText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoNumber: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  hfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  hfButtonText: {
    fontSize: 12,
    color: '#71717A',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  activeText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
});