/**
 * @file OverpaymentRefundCard.tsx
 * @description State-driven lifecycle card for excess overpayment refunds.
 * Standardized to the canonical Thrail white card design system (matching CancellationCard)
 * with responsive button layouts and the user-aligned proof -> helper -> buttons hierarchy.
 */

import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { httpsCallable } from 'firebase/functions';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking } from '@/src/core/models/Booking/Booking';
import { functions } from '@/src/core/config/Firebase';
import { IconLibrary } from '@/src/types/ui.types';

const DISPUTE_SUGGESTIONS = [
    'No incoming transfer received',
    'Transfer amount does not match',
    'Sent to wrong e-wallet account',
    'Transaction reference not found',
];

export interface OverpaymentRefundCardProps {
    booking: Booking;
    onRefresh?: () => void;
    onOpenWalletModal?: () => void;
}

const OverpaymentRefundCard: React.FC<OverpaymentRefundCardProps> = ({
    booking,
    onRefresh,
}) => {
    const { showToast } = useToast();
    const overpayment = booking.overpayment;
    const status = overpayment?.status;

    // Collapsible accordion state matching CancellationCard
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    // Handshake states
    const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
    const [isConfirmingReceipt, setIsConfirmingReceipt] = useState<boolean>(false);
    const [isDisputeModalVisible, setIsDisputeModalVisible] = useState<boolean>(false);
    const [disputeReason, setDisputeReason] = useState<string>('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState<boolean>(false);

    if (!overpayment || !overpayment.excessAmount || overpayment.excessAmount <= 0) {
        return null;
    }

    const {
        excessAmount,
        userWallet,
        adminRefundReceiptUrl,
        disputeCount = 0,
        disputeReason: existingDisputeReason,
    } = overpayment;

    const isMaxDisputesReached = disputeCount >= 3;

    // Header metadata aligned with status and CancellationCard styling
    const getHeaderMeta = (): {
        title: string;
        subtitle: string;
        iconName: string;
        iconLibrary: IconLibrary;
        iconColor: string;
        iconBgColor: string;
    } => {
        switch (status) {
            case 'awaiting_hiker_wallet':
                return {
                    title: 'Excess Payment Refund',
                    subtitle: `₱${excessAmount.toFixed(2)} excess to be refunded`,
                    iconName: 'peso-sign',
                    iconLibrary: 'FontAwesome6',
                    iconColor: Colors.STATUS_WARNING_TEXT,
                    iconBgColor: Colors.STATUS_WARNING_BG,
                };
            case 'awaiting_admin_payout':
                return {
                    title: 'Excess Refund Pending',
                    subtitle: 'Awaiting organizer payout',
                    iconName: 'clock',
                    iconLibrary: 'Feather',
                    iconColor: Colors.STATUS_PENDING_TEXT,
                    iconBgColor: Colors.STATUS_PENDING_BG,
                };
            case 'awaiting_user_confirmation':
                return {
                    title: 'Refund Payout Sent',
                    subtitle: `₱${excessAmount.toFixed(2)} sent by organizer`,
                    iconName: 'check-circle',
                    iconLibrary: 'Feather',
                    iconColor: Colors.SUCCESS,
                    iconBgColor: Colors.STATUS_APPROVED_BG,
                };
            case 'refund_disputed':
                return {
                    title: 'Excess Refund Disputed',
                    subtitle: `Attempt ${Math.min(3, disputeCount)} of 3`,
                    iconName: 'alert-triangle',
                    iconLibrary: 'Feather',
                    iconColor: Colors.ERROR,
                    iconBgColor: Colors.STATUS_CANCELLED_BG,
                };
            case 'completed':
                return {
                    title: 'Excess Refund Completed',
                    subtitle: 'Refund verified & complete',
                    iconName: 'check-circle',
                    iconLibrary: 'Feather',
                    iconColor: Colors.SUCCESS,
                    iconBgColor: Colors.STATUS_APPROVED_BG,
                };
            default:
                return {
                    title: 'Excess Payment Refund',
                    subtitle: `₱${excessAmount.toFixed(2)} excess`,
                    iconName: 'peso-sign',
                    iconLibrary: 'FontAwesome6',
                    iconColor: Colors.STATUS_WARNING_TEXT,
                    iconBgColor: Colors.STATUS_WARNING_BG,
                };
        }
    };

    const headerMeta = getHeaderMeta();

    // Handle confirming payout receipt
    const handleConfirmReceipt = async () => {
        setIsConfirmingReceipt(true);
        try {
            const confirmFn = httpsCallable(functions, 'confirmOverpaymentReceived');
            await confirmFn({
                bookingId: booking.id,
                userId: booking.user?.id,
            });

            showToast.success('Excess refund confirmed received. Thank you!');
            if (onRefresh) onRefresh();
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to confirm refund receipt.');
        } finally {
            setIsConfirmingReceipt(false);
        }
    };

    // Handle submitting dispute
    const handleSubmitDispute = async () => {
        if (!disputeReason.trim()) {
            showToast.error('Please describe why the refund was not received.');
            return;
        }

        setIsSubmittingDispute(true);
        try {
            const disputeFn = httpsCallable(functions, 'disputeOverpaymentRefund');
            await disputeFn({
                bookingId: booking.id,
                userId: booking.user?.id,
                disputeReason: disputeReason.trim(),
            });

            showToast.success('Dispute reported to the tour organizer.');
            setIsDisputeModalVisible(false);
            setDisputeReason('');
            if (onRefresh) onRefresh();
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to report dispute.');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const renderDisputeModal = () => (
        <Modal
            visible={isDisputeModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => !isSubmittingDispute && setIsDisputeModalVisible(false)}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalBackdrop}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.modalScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.disputeModalCard}>
                        {/* Header matching CancellationCard */}
                        <View style={styles.disputeModalHeader}>
                            <View style={styles.disputeIconWrap}>
                                <CustomIcon library="Feather" name="alert-triangle" size={20} color={Colors.ERROR} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <CustomText style={styles.disputeModalTitle}>
                                    Report Refund Issue
                                </CustomText>
                                <CustomText style={styles.disputeModalSubtitle}>
                                    Attempt {Math.min(3, disputeCount + 1)} of 3
                                </CustomText>
                            </View>
                            <TouchableOpacity
                                onPress={() => !isSubmittingDispute && setIsDisputeModalVisible(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <CustomIcon library="Feather" name="x" size={18} color={Colors.TEXT_SECONDARY} />
                            </TouchableOpacity>
                        </View>

                        <CustomText style={styles.disputeModalDesc}>
                            If you checked your e-wallet and haven&apos;t received the funds, or if there is an issue with the organizer&apos;s receipt proof, describe it below. The organizer will be notified immediately to re-verify the payout.
                        </CustomText>

                        <CustomFeedbackInput
                            placeholder="e.g. Checked GCash transaction history at 2:30 PM, no incoming transfer of ₱500 found..."
                            value={disputeReason}
                            onChangeText={setDisputeReason}
                            suggestions={DISPUTE_SUGGESTIONS}
                            variant="danger"
                            style={{ marginBottom: 4 }}
                        />

                        {/* Chat Notice Box */}
                        <View style={styles.disputeModalChatNotice}>
                            <CustomIcon library="Feather" name="message-circle" size={14} color={Colors.TEXT_SECONDARY} />
                            <CustomText style={styles.disputeModalChatNoticeText}>
                                You will remain in the tour group chat so you can coordinate with the organizer until your refund is resolved.
                            </CustomText>
                        </View>

                        <View style={styles.disputeModalActions}>
                            <TouchableOpacity
                                style={styles.disputeCancelBtn}
                                onPress={() => !isSubmittingDispute && setIsDisputeModalVisible(false)}
                                disabled={isSubmittingDispute}
                            >
                                <CustomText style={styles.disputeCancelBtnText}>Cancel</CustomText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.disputeSubmitBtn,
                                    (!disputeReason.trim() || isSubmittingDispute) && styles.btnDisabled,
                                ]}
                                onPress={handleSubmitDispute}
                                disabled={isSubmittingDispute || !disputeReason.trim()}
                            >
                                {isSubmittingDispute ? (
                                    <ActivityIndicator size="small" color={Colors.WHITE} />
                                ) : (
                                    <CustomText style={styles.disputeSubmitBtnText}>Submit Appeal</CustomText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {/* Standard Accordion Header matching CancellationCard */}
            <TouchableOpacity
                style={[styles.headerRow, !isExpanded && styles.headerRowCollapsed]}
                onPress={() => setIsExpanded(prev => !prev)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeftGroup}>
                    <View style={[styles.iconCircle, { backgroundColor: headerMeta.iconBgColor }]}>
                        <CustomIcon
                            library={headerMeta.iconLibrary}
                            name={headerMeta.iconName}
                            size={headerMeta.iconLibrary === 'FontAwesome6' ? 16 : 18}
                            color={headerMeta.iconColor}
                        />
                    </View>
                    <View style={styles.headerTextGroup}>
                        <CustomText variant="label" style={styles.headerTitle}>
                            {headerMeta.title}
                        </CustomText>
                        <CustomText variant="caption" style={styles.headerSubtitle}>
                            {headerMeta.subtitle}
                        </CustomText>
                    </View>
                </View>
                <View style={styles.chevronWrapper}>
                    <CustomIcon
                        library="Feather"
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.TEXT_SECONDARY}
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.bodyContent}>
                    {/* State 1: Awaiting Hiker Wallet Submission */}
                    {status === 'awaiting_hiker_wallet' && (
                        <>
                            <View style={styles.detailBox}>
                                <CustomText variant="caption" style={styles.detailBoxHeader}>
                                    RESERVATION STATUS: 100% PAID &amp; CONFIRMED
                                </CustomText>
                                <CustomText style={styles.detailBoxBody}>
                                    You paid an excess of ₱{excessAmount.toFixed(2)}. The organizer will refund this excess amount directly to your GCash or Maya digital wallet.
                                </CustomText>
                            </View>

                            <View style={styles.infoBanner}>
                                <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                                <CustomText style={styles.infoBannerText}>
                                    Please tap &quot;Submit Refund Details&quot; in the bottom footer to enter your GCash or Maya details.
                                </CustomText>
                            </View>
                        </>
                    )}

                    {/* State 2: Awaiting Organizer Payout */}
                    {status === 'awaiting_admin_payout' && (
                        <>
                            <View style={styles.detailBox}>
                                <CustomText variant="caption" style={styles.detailBoxHeader}>
                                    SUBMITTED WALLET DETAILS
                                </CustomText>
                                <CustomText style={styles.detailBoxBody}>
                                    {userWallet?.walletType || 'E-Wallet'} ({userWallet?.accountNumber || ''}) — {userWallet?.accountName || ''}
                                </CustomText>
                            </View>

                            <View style={styles.infoBanner}>
                                <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                                <CustomText style={styles.infoBannerText}>
                                    The organizer is preparing your ₱{excessAmount.toFixed(2)} refund. You will be notified once payout proof is uploaded.
                                </CustomText>
                            </View>
                        </>
                    )}

                    {/* State 3: Awaiting User Confirmation (Handshake) */}
                    {/* User-specified order: 1) View Proof -> 2) Helper notice -> 3) Action buttons */}
                    {status === 'awaiting_user_confirmation' && (
                        <>
                            {Boolean(adminRefundReceiptUrl) && (
                                <TouchableOpacity
                                    style={styles.viewProofBtn}
                                    onPress={() => setIsPreviewVisible(true)}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="eye" size={15} color={Colors.PRIMARY} />
                                    <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                                </TouchableOpacity>
                            )}

                            <View style={styles.infoBanner}>
                                <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                                <CustomText style={styles.infoBannerText}>
                                    The organizer has sent your ₱{excessAmount.toFixed(2)} refund and uploaded receipt proof. Please check your e-wallet and confirm receipt below.
                                </CustomText>
                            </View>

                            <View style={styles.handshakeActionRow}>
                                <TouchableOpacity
                                    style={styles.confirmReceivedPrimaryBtn}
                                    onPress={handleConfirmReceipt}
                                    disabled={isConfirmingReceipt}
                                    activeOpacity={0.8}
                                >
                                    {isConfirmingReceipt ? (
                                        <ActivityIndicator size="small" color={Colors.WHITE} />
                                    ) : (
                                        <>
                                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.WHITE} />
                                            <CustomText style={styles.confirmReceivedPrimaryBtnText}>
                                                Confirm Received (₱{excessAmount.toFixed(2)})
                                            </CustomText>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {isMaxDisputesReached ? (
                                    <View style={styles.maxDisputeReachedBox}>
                                        <CustomIcon library="Feather" name="info" size={14} color={Colors.TEXT_SECONDARY} />
                                        <CustomText style={styles.maxDisputeReachedText}>
                                            Max disputes reached (3/3). Please coordinate directly with the organizer in the tour group chat.
                                        </CustomText>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.disputeOutlineBtn}
                                        onPress={() => setIsDisputeModalVisible(true)}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon library="Feather" name="alert-triangle" size={15} color={Colors.ERROR} />
                                        <CustomText style={styles.disputeOutlineBtnText}>
                                            Not Received / Appeal
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}

                    {/* State 4: Refund Disputed */}
                    {status === 'refund_disputed' && (
                        <>
                            <View style={styles.disputeReasonBox}>
                                <CustomText variant="caption" style={styles.disputeReasonHeader}>
                                    YOUR REPORTED ISSUE (ATTEMPT {disputeCount}/3):
                                </CustomText>
                                <CustomText style={styles.disputeReasonBody}>
                                    &quot;{existingDisputeReason || 'Refund not received.'}&quot;
                                </CustomText>
                            </View>

                            {Boolean(adminRefundReceiptUrl) && (
                                <TouchableOpacity
                                    style={styles.viewDisputedProofBtn}
                                    onPress={() => setIsPreviewVisible(true)}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="file-text" size={15} color={Colors.PRIMARY} />
                                    <CustomText style={styles.viewDisputedProofBtnText}>View Disputed Receipt Proof</CustomText>
                                </TouchableOpacity>
                            )}

                            <View style={styles.infoBanner}>
                                <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                                <CustomText style={styles.infoBannerText}>
                                    The organizer has been notified to re-verify or re-send the transfer. You will remain in the tour group chat until this is resolved.
                                </CustomText>
                            </View>

                            <View style={styles.disputedLateBlock}>
                                <CustomText style={styles.disputedLateNoticeText}>
                                    Payment arrived in your account after all?
                                </CustomText>
                                <TouchableOpacity
                                    style={styles.confirmReceivedSmallBtn}
                                    onPress={handleConfirmReceipt}
                                    disabled={isConfirmingReceipt}
                                    activeOpacity={0.8}
                                >
                                    {isConfirmingReceipt ? (
                                        <ActivityIndicator size="small" color={Colors.WHITE} />
                                    ) : (
                                        <>
                                            <CustomIcon library="Feather" name="check" size={14} color={Colors.WHITE} />
                                            <CustomText style={styles.confirmReceivedSmallBtnText}>
                                                I Received It Now
                                            </CustomText>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* State 5: Completed */}
                    {status === 'completed' && (
                        <>
                            <View style={styles.detailBox}>
                                <CustomText variant="caption" style={styles.detailBoxHeader}>
                                    REFUND STATUS: COMPLETED
                                </CustomText>
                                <CustomText style={styles.detailBoxBody}>
                                    You confirmed receipt of the ₱{excessAmount.toFixed(2)} refund. Your tour reservation remains active and confirmed!
                                </CustomText>
                            </View>

                            {Boolean(adminRefundReceiptUrl) && (
                                <TouchableOpacity
                                    style={styles.viewProofBtn}
                                    onPress={() => setIsPreviewVisible(true)}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="eye" size={15} color={Colors.PRIMARY} />
                                    <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}

            {/* Proof Preview Modal */}
            {Boolean(adminRefundReceiptUrl) && (
                <ImagePreviewModal
                    visible={isPreviewVisible}
                    imageUrl={adminRefundReceiptUrl}
                    onClose={() => setIsPreviewVisible(false)}
                />
            )}

            {/* Dispute Reason Modal */}
            {renderDisputeModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerRowCollapsed: {
        marginBottom: 0,
    },
    headerLeftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextGroup: {
        flex: 1,
        gap: 2,
    },
    headerTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    headerSubtitle: {
        color: Colors.TEXT_SECONDARY,
    },
    chevronWrapper: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bodyContent: {
        gap: 12,
    },
    detailBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 4,
    },
    detailBoxHeader: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.TEXT_SECONDARY,
    },
    detailBoxBody: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 18,
    },
    disputeReasonBox: {
        backgroundColor: Colors.ERROR_BG,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 4,
    },
    disputeReasonHeader: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.ERROR,
    },
    disputeReasonBody: {
        fontSize: 13,
        color: Colors.ERROR,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 12,
    },
    infoBannerText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
        flex: 1,
    },
    viewProofBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        paddingVertical: 11,
    },
    viewProofBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    viewDisputedProofBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.WHITE,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 10,
    },
    viewDisputedProofBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    handshakeActionRow: {
        gap: 10,
        marginTop: 4,
    },
    confirmReceivedPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.SUCCESS,
        paddingVertical: 13,
        borderRadius: 10,
        width: '100%',
    },
    confirmReceivedPrimaryBtnText: {
        color: Colors.WHITE,
        fontSize: 14,
        fontWeight: 'bold',
    },
    disputeOutlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderColor: Colors.ERROR,
        backgroundColor: Colors.WHITE,
        paddingVertical: 12,
        borderRadius: 10,
        width: '100%',
    },
    disputeOutlineBtnText: {
        color: Colors.ERROR,
        fontSize: 13,
        fontWeight: 'bold',
    },
    maxDisputeReachedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 10,
        borderRadius: 8,
    },
    maxDisputeReachedText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        flex: 1,
        lineHeight: 16,
    },
    disputedLateBlock: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    disputedLateNoticeText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    confirmReceivedSmallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 10,
        paddingVertical: 11,
        width: '100%',
    },
    confirmReceivedSmallBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
        fontWeight: 'bold',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: Colors.MODAL_OVERLAY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disputeModalCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 440,
        gap: 12,
        ...GlobalStyles.dropShadow(4),
    },
    disputeModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    disputeIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disputeModalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    disputeModalSubtitle: {
        fontSize: 12,
        color: Colors.ERROR,
        fontWeight: '600',
    },
    disputeModalDesc: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    disputeModalChatNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 10,
    },
    disputeModalChatNoticeText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        flex: 1,
        lineHeight: 15,
    },
    disputeModalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    disputeCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        alignItems: 'center',
    },
    disputeCancelBtnText: {
        fontSize: 14,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    disputeSubmitBtn: {
        flex: 1.25,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: Colors.ERROR,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disputeSubmitBtnText: {
        fontSize: 14,
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    btnDisabled: {
        opacity: 0.5,
    },
});

export default OverpaymentRefundCard;
