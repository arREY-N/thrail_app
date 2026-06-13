import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

export interface ReasonModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Callback to close the modal */
    onClose: () => void;
    /** Callback when user confirms reason */
    onConfirm: (reason: string) => void;
    /** Type of action being performed */
    actionType: 'cancel' | 'refund' | null | string;
}

/**
 * Modal to collect a reason for cancellation or refund.
 * 
 * @param {ReasonModalProps} props - Component props
 */
const ReasonModal = ({ 
    visible, 
    onClose, 
    onConfirm, 
    actionType 
}: ReasonModalProps) => {
    const [reason, setReason] = useState<string>('');

    const isCancel = actionType === 'cancel';
    const title = isCancel ? "Cancel Booking" : "Request Refund";
    
    const warningText = isCancel 
        ? "This action cannot be undone. Refunds (if applicable) may take 3-7 business days to process."
        : "Refunds are only fully granted if requested at least 7 days before the hike. Processing takes 3-5 business days.";

    const suggestions = isCancel 
        ? [
            "Schedule conflict", 
            "Transportation issue", 
            "Emergency", 
            "Change of mind"
        ]
        : [
            "Medical reason", 
            "Weather concerns", 
            "Booked wrong date", 
            "Emergency"
        ];

    const handleConfirm = () => {
        onConfirm(reason.trim() || (isCancel ? "User requested cancellation" : "User requested refund"));
        setReason(''); 
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal 
            transparent 
            visible={visible} 
            animationType="fade" 
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <TouchableOpacity 
                    style={styles.backdropTouch} 
                    activeOpacity={1} 
                    onPress={onClose} 
                />
                
                <View style={styles.modalContent}>
                    
                    <View style={styles.header}>
                        <CustomText variant="h3" style={styles.title}>
                            {title}
                        </CustomText>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CustomIcon 
                                library="Feather" 
                                name="x" 
                                size={20} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.warningBox}>
                        <CustomIcon 
                            library="Feather" 
                            name="alert-triangle" 
                            size={18} 
                            color={Colors.ERROR} 
                        />
                        <CustomText variant="caption" style={styles.warningText}>
                            {warningText}
                        </CustomText>
                    </View>

                    <CustomFeedbackInput 
                        label={`Reason for ${isCancel ? 'Cancellation' : 'Refund'}`}
                        placeholder={`Please tell us why you are ${isCancel ? 'canceling' : 'requesting a refund'}...`}
                        helperText="Tap a suggestion above or type your own reason."
                        value={reason}
                        onChangeText={setReason}
                        suggestions={suggestions}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={styles.cancelBtn} 
                            onPress={onClose} 
                            activeOpacity={0.7}
                        >
                            <CustomText style={styles.cancelBtnText}>
                                Keep Booking
                            </CustomText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[
                                styles.confirmBtn, 
                                !reason.trim() && styles.confirmBtnDisabled
                            ]} 
                            onPress={handleConfirm}
                            disabled={!reason.trim()}
                            activeOpacity={0.8}
                        >
                            <CustomText style={styles.confirmBtnText}>
                                {isCancel ? "Confirm Cancel" : "Submit Request"}
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const dropShadow = GlobalStyles.dropShadow(3);

const styles = StyleSheet.create({
    overlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        padding: 20 
    },
    backdropTouch: { 
        ...StyleSheet.absoluteFillObject 
    },
    modalContent: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 24, 
         
         
         
         
        ...dropShadow, 
        maxHeight: '90%' 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    title: { 
        marginBottom: 0, 
        color: Colors.ERROR 
    },
    closeBtn: { 
        padding: 4 
    },
    warningBox: { 
        flexDirection: 'row', 
        backgroundColor: Colors.ERROR_BG, 
        padding: 12, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER, 
        gap: 10, 
        marginBottom: 20 
    },
    warningText: { 
        flex: 1, 
        color: Colors.ERROR, 
        lineHeight: 18 
    },
    footer: { 
        flexDirection: 'row', 
        gap: 12, 
        marginTop: 24 
    },
    cancelBtn: { 
        flex: 1, 
        paddingVertical: 14, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    cancelBtnText: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY 
    },
    confirmBtn: { 
        flex: 1, 
        paddingVertical: 14, 
        borderRadius: 12, 
        backgroundColor: Colors.ERROR, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    confirmBtnDisabled: { 
        opacity: 0.5 
    },
    confirmBtnText: { 
        fontWeight: 'bold', 
        color: Colors.WHITE 
    }
});

export default ReasonModal;
