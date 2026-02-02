import React from 'react';
import {
  Modal,
  StyleSheet,
  View
} from 'react-native';

import { Colors } from '@/src/constants/colors';

import CustomButton from '@/src/components/CustomButton';
import CustomText from '@/src/components/CustomText';

const ConfirmationModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  cancelText = "Cancel",
  confirmText = "Confirm"
}) => {

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <CustomText variant="subtitle" style={styles.title}>
            {title}
          </CustomText>

          <CustomText variant="caption" style={styles.message}>
            {message}
          </CustomText>

          <View style={styles.buttonContainer}>
            <CustomButton 
                title={cancelText}
                onPress={onClose}
                variant="secondary"
                style={styles.modalButton}
            />

            <CustomButton 
                title={confirmText}
                onPress={onConfirm}
                variant="primary"
                style={styles.modalButton}
            />
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.MODAL_OVERLAY, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: Colors.WHITE,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 380, 
    shadowColor: Colors.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16
  },
  modalButton: {
    flex: 1, 
    marginBottom: 0,
  }
});

export default ConfirmationModal;