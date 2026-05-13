import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, Icons } from './Icon';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  showGradient?: boolean;
}

/**
 * Reusable bottom sheet modal component
 */
export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  showGradient = false,
}: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            {showGradient && (
              <LinearGradient colors={['#1a1a1a', '#0D0D0D']} style={StyleSheet.absoluteFill} />
            )}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title && <Text style={styles.title}>{title}</Text>}
                 {showCloseButton && (
                   <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
                     <Icon name={Icons.x} size={20} color="#71717A" accessible accessibilityLabel="Close" accessibilityHint="Closes the modal" />
                   </TouchableOpacity>
                 )}
              </View>
            )}
            <View style={styles.content}>{children}</View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
});

export default Modal;