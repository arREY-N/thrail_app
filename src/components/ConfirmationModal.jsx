import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Colors } from '../../src/constants/colors';
import CustomButton from '../components/CustomButton';
import CustomText from '../components/CustomText';

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
          
          <CustomText style={styles.title}>
            {title}
          </CustomText>

          <CustomText style={styles.message}>
            {message}
          </CustomText>

          <View style={styles.buttonContainer}>
            <CustomButton 
                title={cancelText}
                onPress={onClose}
                variant="outline"
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
    backgroundColor: 'rgba(17, 24, 39, 0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.BLACK,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.Gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1, 
    marginBottom: 0,
  }
});

export default ConfirmationModal;