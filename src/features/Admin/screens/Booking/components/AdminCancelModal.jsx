import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const AdminCancelModal = ({ visible, onClose, onConfirm }) => {
    return (
        <Modal 
            transparent={true} 
            visible={visible} 
            animationType="fade" 
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalBox}>
                    <View style={styles.iconCircle}>
                        <CustomIcon library="Feather" name="alert-triangle" size={32} color={Colors.ERROR} />
                    </View>
                    
                    <CustomText variant="h2" style={styles.title}>
                        Cancel Unpaid Booking
                    </CustomText>
                    
                    <CustomText variant="body" style={styles.message}>
                        This user has not paid yet. Are you sure you want to cancel this booking and fail any pending payment sessions?
                    </CustomText>

                    <View style={styles.buttonRow}>
                        <View style={styles.btnWrapper}>
                            <CustomButton 
                                title="Keep Booking" 
                                variant="outline" 
                                onPress={onClose} 
                            />
                        </View>
                        <View style={styles.btnWrapper}>
                            <CustomButton 
                                title="Yes, Cancel" 
                                variant="primary" 
                                onPress={onConfirm} 
                                style={styles.destructiveButton}
                            />
                        </View>
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
    modalBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.ERROR_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        marginBottom: 12,
        textAlign: 'center',
        color: Colors.TEXT_PRIMARY,
    },
    message: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btnWrapper: {
        flex: 1,
    },
    destructiveButton: {
        backgroundColor: Colors.ERROR,
        borderColor: Colors.ERROR,
    }
});

export default AdminCancelModal;