/**
 * @file AdminActionMenu.tsx
 * @description A bottom-sheet action menu for admin booking management.
 */

import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

/**
 * Props for the AdminActionMenu component.
 * @param visible - Whether the action sheet modal is visible.
 * @param onClose - Callback to close the modal.
 * @param isCancelledStatus - Whether the booking has a terminal cancelled/refunded status.
 * @param totalAmountPaid - The total captured payment amount for refund eligibility.
 * @param onRescheduleClick - Callback when "Reschedule Booking" is pressed.
 * @param onRefundClick - Callback when "Issue Refund" is pressed.
 * @param onCancelClick - Callback when "Cancel Booking" is pressed.
 */
interface AdminActionMenuProps {
    visible: boolean;
    onClose: () => void;
    isCancelledStatus: boolean;
    totalAmountPaid: number;
    onRescheduleClick: () => void;
    onRefundClick: () => void;
    onCancelClick: () => void;
}

/**
 * AdminActionMenu — A bottom-sheet action menu for admin booking management.
 * Displays reschedule, refund, or cancel options depending on booking state.
 */
const AdminActionMenu: React.FC<AdminActionMenuProps> = ({ 
    visible, 
    onClose, 
    isCancelledStatus, 
    totalAmountPaid, 
    onRescheduleClick, 
    onRefundClick, 
    onCancelClick 
}) => {
    return (
        <Modal 
            transparent={true} 
            visible={visible} 
            animationType="fade" 
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <View style={styles.actionSheetWrapper}>
                    <View style={styles.actionSheet}>
                        <View style={styles.actionSheetHandle} />
                        
                        <CustomText variant="h3" style={styles.actionSheetTitle}>
                            Manage Booking
                        </CustomText>
                        
                        {!isCancelledStatus ? (
                            <>
                                <TouchableOpacity 
                                    style={styles.actionItem} 
                                    onPress={onRescheduleClick}
                                >
                                    <View style={styles.actionIconBg}>
                                        <CustomIcon library="Feather" name="calendar" size={18} color={Colors.PRIMARY} />
                                    </View>
                                    <CustomText style={styles.actionItemText}>
                                        Reschedule Booking
                                    </CustomText>
                                </TouchableOpacity>

                                {totalAmountPaid > 0 ? (
                                    <TouchableOpacity 
                                        style={styles.actionItem} 
                                        onPress={onRefundClick}
                                    >
                                        <View style={[ styles.actionIconBg, { backgroundColor: Colors.ERROR_BG }]}>
                                            <CustomIcon library="Feather" name="corner-up-left" size={18} color={Colors.ERROR} />
                                        </View>
                                        <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>
                                            Issue Refund
                                        </CustomText>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.actionItem} 
                                        onPress={onCancelClick}
                                    >
                                        <View style={[ styles.actionIconBg, { backgroundColor: Colors.ERROR_BG }]}>
                                            <CustomIcon library="Feather" name="x-circle" size={18} color={Colors.ERROR} />
                                        </View>
                                        <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>
                                            Cancel Booking
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={styles.lockedStateBox}>
                                <CustomIcon library="Feather" name="lock" size={32} color={Colors.GRAY_MEDIUM} style={{ marginBottom: 12 }} />
                                <CustomText style={styles.lockedStateText}>
                                    No actions available. This booking has already been closed, cancelled, or refunded.
                                </CustomText>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { 
        flex: 1, 
        backgroundColor: Colors.MODAL_OVERLAY, 
        justifyContent: 'flex-end', 
        alignItems: 'center' 
    },
    actionSheetWrapper: { 
        width: '100%', 
        maxWidth: 768 
    },
    actionSheet: { 
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        padding: 24, 
        paddingBottom: 40 
    },
    actionSheetHandle: { 
        width: 40, 
        height: 4, 
        backgroundColor: Colors.GRAY_LIGHT, 
        borderRadius: 2, 
        alignSelf: 'center', 
        marginBottom: 16 
    },
    actionSheetTitle: { 
        marginBottom: 20 
    },
    actionItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT, 
        gap: 16 
    },
    actionIconBg: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    actionItemText: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: Colors.TEXT_PRIMARY 
    },
    lockedStateBox: {
        paddingVertical: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockedStateText: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
        paddingHorizontal: 16,
    }
});

export default AdminActionMenu;
