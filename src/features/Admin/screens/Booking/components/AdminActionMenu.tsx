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
 * @param hasPendingCancellation - Whether a cancellation request is currently pending or active.
 */
interface AdminActionMenuProps {
    visible: boolean;
    onClose: () => void;
    isCancelledStatus: boolean;
    totalAmountPaid: number;
    totalRefundedAmount?: number;
    remainingRefundableAmount?: number;
    onRescheduleClick: () => void;
    onRefundClick: () => void;
    onCancelClick: () => void;
    hasPendingCancellation?: boolean;
    isFinishedStatus?: boolean;
    isOfferFinished?: boolean;
}

/**
 * AdminActionMenu — A bottom-sheet action menu for admin booking management.
 * Displays reschedule, refund, or cancel options independently based on booking state.
 */
const AdminActionMenu: React.FC<AdminActionMenuProps> = ({ 
    visible, 
    onClose, 
    isCancelledStatus, 
    totalAmountPaid, 
    totalRefundedAmount = 0,
    remainingRefundableAmount,
    onRescheduleClick, 
    onRefundClick, 
    onCancelClick,
    hasPendingCancellation = false,
    isFinishedStatus = false,
    isOfferFinished = false,
}) => {
    // Decoupled Business rules (Issue #154):
    // 1. REFUND: Available whenever there is captured money that has not been 100% refunded yet
    const remainingRefundable = remainingRefundableAmount !== undefined
        ? remainingRefundableAmount
        : Math.max(0, totalAmountPaid - totalRefundedAmount);
    const canRefund = remainingRefundable > 0.01;

    // 2. RESCHEDULE: Available on active AND cancelled bookings (unless past offer date or finished/expired)
    const canReschedule = !isOfferFinished && !isFinishedStatus;

    // 3. CANCEL: Available on active bookings that are not already cancelled or pending cancellation
    const canCancel = !isCancelledStatus && !hasPendingCancellation;

    const hasAnyAction = canReschedule || canRefund || canCancel;

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
                        
                        {hasAnyAction ? (
                            <>
                                {canReschedule && (
                                    <TouchableOpacity 
                                        style={styles.actionItem} 
                                        onPress={onRescheduleClick}
                                    >
                                        <View style={styles.actionIconBg}>
                                            <CustomIcon library="Feather" name="calendar" size={18} color={Colors.PRIMARY} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <CustomText style={styles.actionItemText}>
                                                Reschedule Booking
                                            </CustomText>
                                            {isCancelledStatus && (
                                                <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY, marginTop: 2 }}>
                                                    Rebook hiker to a new date
                                                </CustomText>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {canRefund && (
                                    <TouchableOpacity 
                                        style={styles.actionItem} 
                                        onPress={onRefundClick}
                                    >
                                        <View style={[ styles.actionIconBg, { backgroundColor: Colors.ERROR_BG }]}>
                                            <CustomIcon library="Feather" name="corner-up-left" size={18} color={Colors.ERROR} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>
                                                Issue Refund
                                            </CustomText>
                                            <CustomText variant="caption" style={{ color: Colors.TEXT_SECONDARY, marginTop: 2 }}>
                                                ₱{remainingRefundable.toFixed(2)} refundable balance
                                            </CustomText>
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {canCancel && (
                                    <TouchableOpacity 
                                        style={styles.actionItem} 
                                        onPress={onCancelClick}
                                    >
                                        <View style={[ styles.actionIconBg, { backgroundColor: Colors.ERROR_BG }]}>
                                            <CustomIcon library="Feather" name="x-circle" size={18} color={Colors.ERROR} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <CustomText style={[styles.actionItemText, { color: Colors.ERROR }]}>
                                                Cancel Booking
                                            </CustomText>
                                        </View>
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
