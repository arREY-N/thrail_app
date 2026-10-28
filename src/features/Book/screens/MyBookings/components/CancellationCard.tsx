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
import { useRouter } from 'expo-router';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { useToast } from '@/src/components/Toast/Toast';
import ExpandableText from '@/src/components/ExpandableText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation, useCancellationUser } from '@/src/core/models/Cancellation/Cancellation';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

export interface CancellationCardProps {
    /** The active booking */
    booking: Booking;
    /** The active cancellation request associated with this booking, if any */
    cancellation?: Cancellation | null;
    /** Handler to withdraw an active cancellation request */
    onWithdraw?: (cancellation: Cancellation) => void | Promise<void>;
    /** Handler to appeal / update the cancellation reason */
    onAppeal?: (cancellation: Cancellation) => void;
    /** Handler to accept an admin-initiated cancellation */
    onAcceptAdminCancellation?: (cancellation: Cancellation) => void | Promise<void>;
    /** Handler to explore or reschedule after admin cancellation */
    onReschedule?: () => void;
}

/**
 * In-Page Lifecycle Card for displaying cancellation states, reasons,
 * organizer feedback, refund estimates, and user action buttons.
 */
const CancellationCard: React.FC<CancellationCardProps> = ({
    booking,
    cancellation,
    onWithdraw,
    onAppeal,
    onReschedule,
}) => {
    const bookingStatus = booking.status;
    const isCancellationRelated =
        Boolean(cancellation) ||
        [
            'for-cancellation',
            'cancellation-rejected',
            'refund',
            'refunded',
            'cancelled',
        ].includes(bookingStatus || '');

    const isAdminCancelled =
        cancellation?.cancelledBy === 'admin' ||
        (bookingStatus === 'cancelled' && booking.cancelledBy === 'admin');

    const isRejected =
        cancellation?.status === 'rejected' ||
        bookingStatus === 'cancellation-rejected';

    const isCancellationAcceptedOrApproved =
        cancellation?.status === 'approved' ||
        cancellation?.status === 'refund_submitted' ||
        cancellation?.status === 'refund_disputed' ||
        cancellation?.status === 'refund_completed';

    const isNoRefund =
        cancellation?.refundDecision === 'no_refund' ||
        (cancellation?.status === 'approved' &&
         bookingStatus === 'cancelled' &&
         cancellation?.refundAmount === 0 &&
         cancellation?.handshakeStep !== 'awaiting_user_wallet' &&
         cancellation?.handshakeStep !== 'awaiting_admin_payout' &&
         !cancellation?.adminRefundReceiptUrl);

    const isHandshakeCompleted =
        !isNoRefund &&
        (cancellation?.handshakeStep === 'completed' ||
         cancellation?.status === 'refund_completed' ||
         bookingStatus === 'refunded');

    const isApprovedOrRefunded =
        (isCancellationAcceptedOrApproved && !isAdminCancelled) ||
        bookingStatus === 'refund' ||
        bookingStatus === 'refunded' ||
        (bookingStatus === 'cancelled' && !isAdminCancelled && isNoRefund);

    const isCancelledClosed =
        bookingStatus === 'cancelled' && !isAdminCancelled && !isRejected;

    const router = useRouter();

    const { confirmRefundReceived, disputeRefundPayout } = useCancellationUser();
    const { showToast } = useToast();

    const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

    const [showConfirmReceivedModal, setShowConfirmReceivedModal] = useState<boolean>(false);
    const [isConfirmingReceived, setIsConfirmingReceived] = useState<boolean>(false);
    const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
    const [disputeReasonInput, setDisputeReasonInput] = useState<string>('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState<boolean>(false);

    if (!isCancellationRelated) {
        return null;
    }

    const hasRejectedDocs = Array.isArray(booking.documents) && booking.documents.some(d => d.valid === 'rejected');

    const userReason =
        cancellation?.reason ||
        (!hasRejectedDocs ? booking.cancellationReason : undefined) ||
        'No reason provided by user.';

    const adminNote =
        cancellation?.adminNote ||
        (isAdminCancelled ? cancellation?.reason : null);

    const createdAtDate = cancellation?.createdAt
        ? formatDateToStandard(cancellation.createdAt)
        : null;

    const isAppeal = Boolean(
        cancellation?.updatedAt &&
        cancellation?.createdAt &&
        new Date(cancellation.updatedAt).getTime() > new Date(cancellation.createdAt).getTime()
    );

    const hasCapturedPayments = (booking.payment || []).some(p => p.status === 'captured');
    const hasRefundedPayments = (booking.payment || []).some(p => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));
    const totalAmountPaid = booking.payment?.reduce((sum: number, p) => p.status === 'captured' ? sum + p.amount : sum, 0) || 0;
    const totalRefundedAmount = typeof booking.refundedAmount === 'number' && booking.refundedAmount > 0
        ? booking.refundedAmount
        : (typeof cancellation?.refundAmount === 'number' && cancellation.refundAmount > 0
            ? cancellation.refundAmount
            : (booking.payment?.reduce((sum: number, p) => (p.status === 'refunded' || ((p.refundedAmount || 0) > 0)) ? sum + (p.refundedAmount || p.amount) : sum, 0) || 0));
    const isPaid = totalAmountPaid > 0 || totalRefundedAmount > 0 || hasCapturedPayments || hasRefundedPayments;

    const handleExecuteWithdraw = async () => {
        if (!cancellation || !onWithdraw) return;
        setIsWithdrawing(true);
        try {
            await onWithdraw(cancellation);
            setShowWithdrawModal(false);
        } catch {
            setShowWithdrawModal(false);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleExecuteConfirmReceived = async () => {
        if (!booking.id || !booking.business?.id) return;
        setIsConfirmingReceived(true);
        try {
            await confirmRefundReceived({
                bookingId: booking.id,
                cancellationId: cancellation?.id,
                businessId: booking.business.id,
                offerId: booking.offer?.id,
            });
            setShowConfirmReceivedModal(false);
            showToast.success('Refund confirmed! Your refund has been finalized.');
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to confirm refund.');
        } finally {
            setIsConfirmingReceived(false);
        }
    };

    const handleExecuteDispute = async () => {
        if (!booking.id || !booking.business?.id) return;
        if (!disputeReasonInput.trim()) {
            showToast.error('Please provide a reason explaining why the refund was not received.');
            return;
        }
        setIsSubmittingDispute(true);
        try {
            await disputeRefundPayout({
                bookingId: booking.id,
                cancellationId: cancellation?.id,
                businessId: booking.business.id,
                offerId: booking.offer?.id,
                disputeReason: disputeReasonInput.trim(),
            });
            setShowDisputeModal(false);
            setDisputeReasonInput('');
            showToast.success('Dispute submitted. The organizer has been notified to re-verify.');
        } catch (err: unknown) {
            showToast.error(err instanceof Error ? err.message : 'Failed to submit refund dispute.');
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    const renderManualRefundHandshake = () => {
        if (!isPaid || PAYMENT_CONFIG.PROVIDER !== 'manual_qr') return null;

        const isHandshakeCompleted =
            !isNoRefund &&
            (cancellation?.handshakeStep === 'completed' ||
             cancellation?.status === 'refund_completed' ||
             bookingStatus === 'refunded');

        const isDisputed =
            cancellation?.handshakeStep === 'refund_disputed' ||
            cancellation?.status === 'refund_disputed' ||
            booking.paymentVerificationStatus === 'refund_disputed';

        const hasProof = Boolean(cancellation?.adminRefundReceiptUrl);
        const disputeCount = cancellation?.disputeCount || 0;
        const canDispute = disputeCount < 3;

        return (
            <View style={styles.manualRefundHandshakeBox}>
                {isNoRefund ? (
                    <View style={styles.infoBanner}>
                        <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                        <CustomText style={styles.infoBannerText}>
                            This booking has been cancelled and finalized without a refund.
                        </CustomText>
                    </View>
                ) : isHandshakeCompleted ? (
                    <View style={styles.payoutCompletedBox}>
                        <View style={styles.payoutCompletedHeader}>
                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                            <CustomText style={styles.payoutCompletedTitle}>
                                Refund Completed & Received
                            </CustomText>
                        </View>
                        <CustomText style={styles.payoutCompletedSubtitle}>
                            {cancellation?.userConfirmedReceivedAt
                                ? `You confirmed receipt of the refund on ${formatDateToStandard(cancellation.userConfirmedReceivedAt)}. Your refund is fully settled.`
                                : 'You have confirmed receipt of the refund payment. Your refund is complete.'}
                        </CustomText>
                        {hasProof && (
                            <TouchableOpacity
                                style={styles.viewProofBtn}
                                onPress={() => setPreviewProofUrl(cancellation?.adminRefundReceiptUrl || null)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                                <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : isDisputed ? (
                    <View style={styles.disputedAlertBox}>
                        <View style={styles.disputedAlertHeader}>
                            <CustomIcon library="Feather" name="alert-triangle" size={16} color={Colors.ERROR} />
                            <CustomText style={styles.disputedAlertTitle}>
                                Refund Disputed (Attempt {disputeCount}/3)
                            </CustomText>
                        </View>
                        <CustomText style={styles.disputedAlertText}>
                            You reported: &quot;{cancellation?.disputeReason || 'Refund not received.'}&quot;
                        </CustomText>
                        <CustomText style={styles.disputedChatNoticeText}>
                            The organizer has been notified to re-verify or re-send the transfer. You will remain in the tour group chat until this is resolved. Once a new payment proof is submitted, you will be prompted to verify it.
                        </CustomText>
                        {hasProof && (
                            <View style={styles.disputedActionsRow}>
                                <TouchableOpacity
                                    style={styles.viewDisputedProofBtn}
                                    onPress={() => setPreviewProofUrl(cancellation?.adminRefundReceiptUrl || null)}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="file-text" size={14} color={Colors.PRIMARY} />
                                    <CustomText style={styles.viewDisputedProofBtnText}>View Disputed Receipt Proof</CustomText>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.disputedLateNoticeRow}>
                            <CustomText style={styles.disputedLateNoticeText}>
                                Payment arrived in your account after all?
                            </CustomText>
                            <TouchableOpacity
                                style={styles.confirmReceivedSmallBtn}
                                onPress={() => setShowConfirmReceivedModal(true)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon library="Feather" name="check" size={13} color={Colors.WHITE} />
                                <CustomText style={styles.confirmReceivedSmallBtnText}>
                                    I Received It Now
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : hasProof ? (
                    <View style={styles.payoutCompletedBox}>
                        <View style={styles.payoutCompletedHeader}>
                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                            <CustomText style={styles.payoutCompletedTitle}>
                                Refund Payout Sent by Organizer
                            </CustomText>
                        </View>
                        <CustomText style={styles.payoutCompletedSubtitle}>
                            The organizer has sent your refund of ₱{(cancellation?.refundAmount ?? totalRefundedAmount ?? totalAmountPaid).toFixed(2)} and uploaded receipt proof. Please check your e-wallet and confirm receipt below.
                        </CustomText>
                        <TouchableOpacity
                            style={styles.viewProofBtn}
                            onPress={() => setPreviewProofUrl(cancellation?.adminRefundReceiptUrl || null)}
                            activeOpacity={0.8}
                        >
                            <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                            <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                        </TouchableOpacity>

                        <View style={styles.handshakeActionRow}>
                            <TouchableOpacity
                                style={styles.confirmReceivedPrimaryBtn}
                                onPress={() => setShowConfirmReceivedModal(true)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.WHITE} />
                                <CustomText style={styles.confirmReceivedPrimaryBtnText}>
                                    Confirm Received
                                </CustomText>
                            </TouchableOpacity>

                            {canDispute ? (
                                <TouchableOpacity
                                    style={styles.disputeOutlineBtn}
                                    onPress={() => setShowDisputeModal(true)}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="alert-triangle" size={15} color={Colors.ERROR} />
                                    <CustomText style={styles.disputeOutlineBtnText}>
                                        Not Received / Appeal
                                    </CustomText>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.maxDisputeReachedBox}>
                                    <CustomIcon library="Feather" name="info" size={14} color={Colors.TEXT_SECONDARY} />
                                    <CustomText style={styles.maxDisputeReachedText}>
                                        Max disputes reached (3/3). Please chat directly with organizer in the tour group chat.
                                    </CustomText>
                                </View>
                            )}
                        </View>
                    </View>
                ) : cancellation?.userWallet ? (
                    <View style={styles.walletSubmittedBox}>
                        <View style={styles.walletSubmittedHeader}>
                            <CustomIcon library="Feather" name="clock" size={16} color={Colors.STATUS_PENDING_TEXT} />
                            <CustomText style={styles.walletSubmittedTitle}>
                                Wallet Submitted — Awaiting Payout
                            </CustomText>
                        </View>
                        <CustomText style={styles.walletSubmittedText}>
                            Account: {cancellation.userWallet.walletType} ({cancellation.userWallet.accountNumber}) - {cancellation.userWallet.accountName}
                        </CustomText>
                        <TouchableOpacity
                            style={styles.updateWalletBtn}
                            onPress={() => router.push({ pathname: '/book/refund', params: { bookingId: booking.id, cancellationId: cancellation?.id } })}
                            activeOpacity={0.7}
                        >
                            <CustomText style={styles.updateWalletBtnText}>Edit Wallet Details</CustomText>
                        </TouchableOpacity>
                    </View>
                ) : cancellation?.refundDecision === 'no_refund' || (cancellation?.refundAmount === 0 && (cancellation?.status === 'approved' || isAdminCancelled)) ? (
                    <View style={styles.infoBanner}>
                        <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                        <CustomText style={styles.infoBannerText}>
                            This booking has been cancelled and finalized without a refund.
                        </CustomText>
                    </View>
                ) : (!isAdminCancelled && (cancellation?.handshakeStep === 'awaiting_admin_refund_decision' || cancellation?.refundAmount === undefined)) ? (
                    <View style={styles.awaitingDecisionBox}>
                        <View style={styles.awaitingDecisionHeader}>
                            <CustomIcon library="Feather" name="clock" size={16} color={Colors.STATUS_PENDING_TEXT} />
                            <CustomText style={styles.awaitingDecisionTitle}>
                                Cancellation Approved — Awaiting Refund Amount
                            </CustomText>
                        </View>
                        <CustomText style={styles.awaitingDecisionText}>
                            The organizer is reviewing this booking to set the refund amount. You will be prompted to verify once the refund is sent.
                        </CustomText>
                    </View>
                ) : (
                    <View style={styles.needWalletBox}>
                        <View style={styles.needWalletHeader}>
                            <CustomIcon library="Feather" name="alert-circle" size={16} color={Colors.PRIMARY} />
                            <CustomText style={styles.needWalletTitle}>
                                Action Required: Submit Refund Wallet
                            </CustomText>
                        </View>
                        <CustomText style={styles.needWalletText}>
                            The organizer has approved a refund of ₱{(cancellation?.refundAmount ?? totalAmountPaid).toFixed(2)}. Please submit your GCash or Maya wallet so the organizer can send your payment.
                        </CustomText>
                        <TouchableOpacity
                            style={styles.enterWalletBtn}
                            onPress={() => router.push({ pathname: '/book/refund', params: { bookingId: booking.id, cancellationId: cancellation?.id } })}
                            activeOpacity={0.8}
                        >
                            <CustomText style={styles.enterWalletBtnText}>
                                Enter GCash / Maya Wallet Details
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderConfirmationModal = () => (
        <>
            <ConfirmationModal
                visible={showWithdrawModal}
                onClose={() => !isWithdrawing && setShowWithdrawModal(false)}
                onConfirm={handleExecuteWithdraw}
                title="Withdraw Cancellation Request"
                message="Are you sure you want to withdraw your cancellation request? Your booking will remain active and confirmed."
                confirmText="Yes, Withdraw"
                cancelText="Keep Request"
                isDestructive={true}
                isLoading={isWithdrawing}
                iconName="alert-triangle"
                iconColor={Colors.ERROR}
            />

            <ConfirmationModal
                visible={showConfirmReceivedModal}
                onClose={() => !isConfirmingReceived && setShowConfirmReceivedModal(false)}
                onConfirm={handleExecuteConfirmReceived}
                title="Confirm Refund Received"
                message={`Are you sure you have received the refund amount of ₱${(cancellation?.refundAmount ?? totalRefundedAmount ?? totalAmountPaid).toFixed(2)}${cancellation?.userWallet ? ` in your ${cancellation.userWallet.walletType} account (${cancellation.userWallet.accountNumber})` : ''}? This will mark the refund as complete and release your tour slot.`}
                confirmText="Yes, Received"
                cancelText="Cancel"
                isDestructive={false}
                isLoading={isConfirmingReceived}
                iconName="check-circle"
                iconColor={Colors.SUCCESS}
            />

            <Modal
                visible={showDisputeModal}
                transparent
                animationType="fade"
                onRequestClose={() => !isSubmittingDispute && setShowDisputeModal(false)}
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
                            <View style={styles.disputeModalHeader}>
                                <View style={styles.disputeIconWrap}>
                                    <CustomIcon library="Feather" name="alert-triangle" size={20} color={Colors.ERROR} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <CustomText style={styles.disputeModalTitle}>
                                        Report Refund Issue
                                    </CustomText>
                                    <CustomText style={styles.disputeModalSubtitle}>
                                        Attempt {Math.min(3, (cancellation?.disputeCount || 0) + 1)} of 3
                                    </CustomText>
                                </View>
                            </View>

                            <CustomText style={styles.disputeModalDesc}>
                                If you checked your e-wallet and haven&apos;t received the funds, or if there is an issue with the organizer&apos;s receipt proof, describe it below. The organizer will be notified immediately to re-verify the payout.
                            </CustomText>

                            <CustomTextInput
                                multiline
                                numberOfLines={3}
                                placeholder="e.g. Checked GCash transaction history at 2:30 PM, no incoming transfer of ₱500 found..."
                                value={disputeReasonInput}
                                onChangeText={setDisputeReasonInput}
                                style={{ marginBottom: 4 }}
                                containerStyle={{ minHeight: 96 }}
                            />

                            <View style={styles.disputeModalChatNotice}>
                                <CustomIcon library="Feather" name="message-circle" size={14} color={Colors.TEXT_SECONDARY} />
                                <CustomText style={styles.disputeModalChatNoticeText}>
                                    You will remain in the tour group chat so you can coordinate with the organizer until your refund is resolved.
                                </CustomText>
                            </View>

                            <View style={styles.disputeModalActions}>
                                <TouchableOpacity
                                    style={styles.disputeCancelBtn}
                                    onPress={() => !isSubmittingDispute && setShowDisputeModal(false)}
                                    disabled={isSubmittingDispute}
                                >
                                    <CustomText style={styles.disputeCancelBtnText}>Cancel</CustomText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.disputeSubmitBtn,
                                        !disputeReasonInput.trim() && styles.btnDisabled,
                                    ]}
                                    onPress={handleExecuteDispute}
                                    disabled={isSubmittingDispute || !disputeReasonInput.trim()}
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

            {previewProofUrl && (
                <ImagePreviewModal
                    visible={Boolean(previewProofUrl)}
                    imageUrl={previewProofUrl}
                    onClose={() => setPreviewProofUrl(null)}
                />
            )}
        </>
    );

    // 1. ORGANIZER INITIATED CANCELLATION
    if (isAdminCancelled) {
        return (
            <>
                <View style={styles.container}>
                    <TouchableOpacity
                        style={[styles.headerRow, !isExpanded && styles.headerRowCollapsed]}
                        onPress={() => setIsExpanded(prev => !prev)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.headerLeftGroup}>
                            <View style={styles.iconCircleError}>
                                <CustomIcon
                                    library="Feather"
                                    name="alert-circle"
                                    size={18}
                                    color={Colors.ERROR}
                                />
                            </View>
                            <View style={styles.headerTextGroup}>
                                <CustomText variant="label" style={styles.titleError}>
                                    Hike Cancelled by Organizer
                                </CustomText>
                                <CustomText variant="caption" style={styles.subtitle}>
                                    Event cancellation notice
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
                        <>
                            <View style={styles.noticeBox}>
                                <CustomText variant="caption" style={styles.noticeLabel}>
                                    Organizer&apos;s Explanation:
                                </CustomText>
                                <CustomText style={styles.noticeText}>
                                    {adminNote || 'The organizer had to cancel this hike due to weather, safety, or schedule constraints.'}
                                </CustomText>
                            </View>

                            <View style={styles.actionsColumn}>
                                {isPaid && PAYMENT_CONFIG.PROVIDER === 'manual_qr' ? (
                                    renderManualRefundHandshake()
                                ) : !isPaid ? (
                                    <View style={styles.infoBanner}>
                                        <CustomIcon library="Feather" name="info" size={16} color={Colors.TEXT_SECONDARY} />
                                        <CustomText style={styles.infoBannerText}>
                                            This booking is unpaid and has been cancelled. Your reservation spot has been released.
                                        </CustomText>
                                    </View>
                                ) : null}

                                {onReschedule && totalAmountPaid > 0 && !cancellation?.adminRefundReceiptUrl && !isNoRefund && !isHandshakeCompleted && (
                                    <TouchableOpacity
                                        style={styles.outlineBtn}
                                        onPress={onReschedule}
                                        activeOpacity={0.7}
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name="calendar"
                                            size={16}
                                            color={Colors.PRIMARY}
                                        />
                                        <CustomText style={styles.outlineBtnTextPrimary}>
                                            Reschedule to Another Date
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
                {renderConfirmationModal()}
            </>
        );
    }

    // 2. REJECTED / DECLINED BY ORGANIZER (Awaiting Hiker Action: Appeal or Withdraw)
    if (isRejected) {
        return (
            <>
                <View style={styles.container}>
                    <TouchableOpacity
                        style={[styles.headerRow, !isExpanded && styles.headerRowCollapsed]}
                        onPress={() => setIsExpanded(prev => !prev)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.headerLeftGroup}>
                            <View style={styles.iconCircleError}>
                                <CustomIcon
                                    library="Feather"
                                    name="x-octagon"
                                    size={18}
                                    color={Colors.ERROR}
                                />
                            </View>
                            <View style={styles.headerTextGroup}>
                                <CustomText variant="label" style={styles.titleError}>
                                    Cancellation Request Declined
                                </CustomText>
                                <CustomText variant="caption" style={styles.subtitle}>
                                    Reviewed by hike organizer
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
                        <>
                            <View style={styles.errorHighlightBox}>
                                <CustomText variant="caption" style={styles.errorHighlightLabel}>
                                    Reason for Decline:
                                </CustomText>
                                <ExpandableText
                                    text={adminNote || 'The organizer declined this cancellation request based on policy terms.'}
                                    textStyle={styles.errorHighlightText}
                                    arrowColor={Colors.ERROR}
                                    characterLimit={160}
                                />
                            </View>

                            <View style={styles.previousReasonBox}>
                                <CustomText variant="caption" style={styles.previousReasonLabel}>
                                    Your Submitted Reason:
                                </CustomText>
                                <ExpandableText
                                    text={userReason}
                                    quote={true}
                                    textStyle={styles.previousReasonText}
                                    arrowColor={Colors.TEXT_PRIMARY}
                                    characterLimit={160}
                                />
                            </View>

                            <View style={styles.actionsColumn}>
                                {cancellation && onAppeal && (
                                    <TouchableOpacity
                                        style={styles.appealBtn}
                                        onPress={() => onAppeal(cancellation)}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon
                                            library="Feather"
                                            name="edit-3"
                                            size={16}
                                            color={Colors.ERROR}
                                        />
                                        <CustomText style={styles.appealBtnText}>
                                            Appeal / Update Reason
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
                {renderConfirmationModal()}
            </>
        );
    }

    // 3. APPROVED & REFUNDED (Terminal State in History)
    if (isApprovedOrRefunded) {
        const payments = booking.payment || [];
        const isManualRefund = PAYMENT_CONFIG.PROVIDER === 'manual_qr' || payments.some(p => p.gateway === 'manual_qr');
        const isPayMongo = !isManualRefund && payments.some(p => p.gateway === 'paymongo');

        const isDisputed = isManualRefund && (
            cancellation?.handshakeStep === 'refund_disputed' ||
            cancellation?.status === 'refund_disputed' ||
            booking.paymentVerificationStatus === 'refund_disputed'
        );

        const isAwaitingConfirmation = isManualRefund && !isDisputed && Boolean(
            cancellation?.adminRefundReceiptUrl &&
            cancellation?.handshakeStep !== 'completed' &&
            bookingStatus !== 'refunded'
        );

        const isRefundComplete = isPayMongo
            ? (hasRefundedPayments || totalRefundedAmount > 0 || bookingStatus === 'refunded')
            : (cancellation?.handshakeStep === 'completed' || cancellation?.status === 'refund_completed' || bookingStatus === 'refunded');

        const isAwaitingPayout = isManualRefund && Boolean(cancellation?.userWallet && !cancellation?.adminRefundReceiptUrl);
        const isAwaitingWallet = Boolean(isManualRefund && isPaid && !cancellation?.userWallet && !cancellation?.adminRefundReceiptUrl);

        const headerTitle = isNoRefund
            ? 'Cancellation Approved'
            : (isPaid
                ? (isRefundComplete
                    ? 'Cancellation Approved & Refunded'
                    : (isDisputed
                        ? 'Refund Disputed'
                        : (isAwaitingConfirmation
                            ? 'Refund Sent — Please Confirm Receipt'
                            : (isAwaitingPayout
                                ? 'Cancellation Approved — Awaiting Payout'
                                : (isAwaitingWallet
                                    ? 'Cancellation Approved — Action Required'
                                    : 'Cancellation Approved — Refund In Progress')))))
                : 'Cancellation Approved');

        const headerSubtitle = isNoRefund
            ? 'Booking closed without refund'
            : (isPaid
                ? (isRefundComplete
                    ? (isPayMongo ? 'Refund issued via PayMongo · Booking closed' : 'Refund completed & confirmed')
                    : (isDisputed
                        ? `Attempt ${cancellation?.disputeCount || 1} of 3 · Awaiting organizer re-check`
                        : (isAwaitingConfirmation
                            ? 'Organizer uploaded receipt proof · Verify payment'
                            : (isAwaitingPayout
                                ? 'Wallet submitted · Awaiting organizer payout'
                                : (isAwaitingWallet
                                    ? 'Please submit your wallet for refund'
                                    : 'Refund in progress')))))
                : 'Booking closed');

        const headerIcon = isNoRefund
            ? 'check-circle'
            : (isPaid
                ? (isRefundComplete ? 'check-circle' : (isDisputed ? 'alert-triangle' : 'clock'))
                : 'check-circle');

        const headerIconColor = isNoRefund
            ? Colors.PRIMARY
            : (isPaid
                ? (isRefundComplete ? Colors.PRIMARY : (isDisputed ? Colors.ERROR : '#D97706'))
                : Colors.PRIMARY);

        const iconBgStyle = isNoRefund
            ? styles.iconCircleSuccess
            : (isPaid
                ? (isRefundComplete ? styles.iconCircleSuccess : (isDisputed ? styles.iconCircleError : styles.iconCircleWarning))
                : styles.iconCircleSuccess);

        const headerTitleStyle = isNoRefund
            ? styles.titleSuccess
            : (isPaid
                ? (isRefundComplete ? styles.titleSuccess : (isDisputed ? styles.titleError : styles.titleWarning))
                : styles.titleSuccess);

        return (
            <>
                <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.headerRow, !isExpanded && styles.headerRowCollapsed]}
                    onPress={() => setIsExpanded(prev => !prev)}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerLeftGroup}>
                        <View style={iconBgStyle}>
                            <CustomIcon
                                library="Feather"
                                name={headerIcon}
                                size={18}
                                color={headerIconColor}
                            />
                        </View>
                        <View style={styles.headerTextGroup}>
                            <CustomText variant="label" style={headerTitleStyle}>
                                {headerTitle}
                            </CustomText>
                            <CustomText variant="caption" style={styles.subtitle}>
                                {headerSubtitle}
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
                    <>
                        {isPaid && isManualRefund && !isNoRefund ? (
                            <View style={styles.manualRefundHandshakeWrapper}>
                                {renderManualRefundHandshake()}
                            </View>
                        ) : (
                            <View style={styles.successBox}>
                                <CustomText style={styles.successMessage}>
                                    {isNoRefund
                                        ? 'Your cancellation request has been approved and finalized without a refund. Your reservation has been closed.'
                                        : (isPaid
                                            ? (isRefundComplete
                                                ? 'Your cancellation request has been approved and your payment has been refunded to your original payment method via PayMongo.'
                                                : 'Your cancellation request has been approved. The refund transaction is being processed via PayMongo.')
                                            : 'Your cancellation request has been approved. Your reservation has been cancelled and slots released.')}
                                </CustomText>
                                {isPaid && isPayMongo && !isRefundComplete && !isNoRefund && (
                                    <View style={styles.timelineBox}>
                                        <CustomIcon
                                            library="Feather"
                                            name="clock"
                                            size={14}
                                            color={Colors.TEXT_SECONDARY}
                                        />
                                        <CustomText variant="caption" style={styles.timelineText}>
                                            Estimated 3–5 business days to credit back to your original payment method.
                                        </CustomText>
                                    </View>
                                )}
                            </View>
                        )}

                        {Boolean(userReason && userReason !== 'No reason provided by user.') && (
                            <View style={styles.previousReasonBox}>
                                <CustomText variant="caption" style={styles.previousReasonLabel}>
                                    Cancellation Reason:
                                </CustomText>
                                <CustomText style={styles.previousReasonText}>
                                    {`"${userReason}"`}
                                </CustomText>
                            </View>
                        )}
                    </>
                )}
            </View>
            {renderConfirmationModal()}
        </>
    );
}

    // 4. CANCELLED / CLOSED (Terminal State in History without payment)
    if (isCancelledClosed) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.headerRow, !isExpanded && styles.headerRowCollapsed]}
                    onPress={() => setIsExpanded(prev => !prev)}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerLeftGroup}>
                        <View style={styles.iconCircleError}>
                            <CustomIcon
                                library="Feather"
                                name="x-circle"
                                size={18}
                                color={Colors.ERROR}
                            />
                        </View>
                        <View style={styles.headerTextGroup}>
                            <CustomText variant="label" style={styles.titleError}>
                                Booking Cancelled
                            </CustomText>
                            <CustomText variant="caption" style={styles.subtitle}>
                                Reservation closed
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
                    <>
                        <View style={styles.noticeBox}>
                            <CustomText style={styles.noticeText}>
                                This booking has been cancelled and your reservation spot has been released.
                            </CustomText>
                        </View>

                        {Boolean(userReason && userReason !== 'No reason provided by user.') && (
                            <View style={styles.previousReasonBox}>
                                <CustomText variant="caption" style={styles.previousReasonLabel}>
                                    Cancellation Reason:
                                </CustomText>
                                <ExpandableText
                                    text={userReason}
                                    quote={true}
                                    textStyle={styles.previousReasonText}
                                    arrowColor={Colors.TEXT_PRIMARY}
                                    characterLimit={160}
                                />
                            </View>
                        )}
                    </>
                )}
            </View>
        );
    }

    // 5. PENDING REVIEW (DEFAULT SUB-APPROVAL STATE)
    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.headerRow, !isExpanded && styles.headerRowCollapsed]}
                    onPress={() => setIsExpanded(prev => !prev)}
                    activeOpacity={0.7}
                >
                    <View style={styles.headerLeftGroup}>
                        <View style={styles.iconCirclePending}>
                            <CustomIcon
                                library="Feather"
                                name="alert-triangle"
                                size={18}
                                color={Colors.ERROR}
                            />
                        </View>
                        <View style={styles.headerTextGroup}>
                            <CustomText variant="label" style={styles.titlePending}>
                                {isAppeal ? 'Cancellation Request Under Review (Appeal)' : 'Cancellation Request Under Review'}
                            </CustomText>
                            <CustomText variant="caption" style={styles.subtitle}>
                                {createdAtDate ? `Submitted on ${createdAtDate}` : 'Awaiting organizer decision'}
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
                    <>
                        <View style={styles.quoteBox}>
                            <CustomText variant="caption" style={styles.quoteLabel}>
                                {isAppeal ? 'Your Submitted Reason (Appeal):' : 'Your Submitted Reason:'}
                            </CustomText>
                            <ExpandableText
                                text={userReason}
                                quote={true}
                                textStyle={styles.quoteText}
                                arrowColor={Colors.TEXT_PRIMARY}
                                characterLimit={160}
                            />
                        </View>

                        <View style={styles.infoBanner}>
                            <CustomIcon
                                library="Feather"
                                name="info"
                                size={16}
                                color={Colors.TEXT_SECONDARY}
                            />
                            <CustomText variant="caption" style={styles.infoBannerText}>
                                Organizers typically review cancellation requests within 24–48 hours. If approved, your booking will be cancelled and any refundable amount will be returned {PAYMENT_CONFIG.PROVIDER === 'manual_qr' ? 'directly to your e-wallet.' : 'via PayMongo.'}
                            </CustomText>
                        </View>

                        {cancellation && onWithdraw && (
                            <TouchableOpacity
                                style={styles.withdrawTriggerBtn}
                                onPress={() => setShowWithdrawModal(true)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon
                                    library="Feather"
                                    name="rotate-ccw"
                                    size={15}
                                    color={Colors.ERROR}
                                />
                                <CustomText style={styles.withdrawTriggerBtnText}>
                                    Withdraw Cancellation Request
                                </CustomText>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
            {renderConfirmationModal()}
        </>
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
        ...GlobalStyles.dropShadow(3),
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
    chevronWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
        marginLeft: 8,
    },
    headerTextGroup: {
        flex: 1,
        gap: 2,
    },
    iconCircleError: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCirclePending: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleSuccess: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircleWarning: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleWarning: {
        color: '#92400E',
        fontWeight: 'bold',
        fontSize: 16,
    },
    titleError: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    titlePending: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    titleSuccess: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 16,
    },
    subtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    noticeBox: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 14,
    },
    noticeLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    noticeText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        lineHeight: 18,
    },
    errorHighlightBox: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        marginBottom: 14,
    },
    errorHighlightLabel: {
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    errorHighlightText: {
        color: Colors.ERROR,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    previousReasonBox: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 16,
    },
    previousReasonLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    previousReasonText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    quoteBox: {
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 14,
    },
    quoteLabel: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 11,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    quoteText: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 12,
        gap: 10,
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    infoBannerText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 17,
    },
    actionsColumn: {
        gap: 10,
    },
    primaryDestructiveBtn: {
        backgroundColor: Colors.ERROR,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryDestructiveBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 14,
    },
    outlineBtn: {
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.WHITE,
    },
    outlineBtnTextPrimary: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
    },
    appealBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.WHITE,
        borderWidth: 1.5,
        borderColor: Colors.ERROR,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    appealBtnText: {
        color: Colors.ERROR,
        fontWeight: 'bold',
        fontSize: 14,
    },
    successBox: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
    },
    successMessage: {
        color: Colors.PRIMARY,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    timelineBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timelineText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    withdrawTriggerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        paddingVertical: 11,
        gap: 6,
    },
    withdrawTriggerBtnText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 13,
    },

    manualRefundHandshakeWrapper: {
        marginBottom: 14,
    },
    manualRefundHandshakeBox: {
        marginTop: 0,
        gap: 10,
    },
    awaitingDecisionBox: {
        backgroundColor: Colors.STATUS_PENDING_BG,
        borderRadius: 12,
        padding: 14,
        gap: 6,
    },
    awaitingDecisionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    awaitingDecisionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.STATUS_PENDING_TEXT,
    },
    awaitingDecisionText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    needWalletBox: {
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderRadius: 12,
        padding: 14,
        gap: 8,
    },
    needWalletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    needWalletTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    needWalletText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    enterWalletBtn: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 4,
    },
    enterWalletBtnText: {
        color: Colors.WHITE,
        fontSize: 12,
        fontWeight: 'bold',
    },
    walletSubmittedBox: {
        backgroundColor: Colors.STATUS_PENDING_BG,
        borderRadius: 12,
        padding: 14,
        gap: 6,
    },
    walletSubmittedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    walletSubmittedTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.STATUS_PENDING_TEXT,
    },
    walletSubmittedText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    updateWalletBtn: {
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: Colors.WHITE,
    },
    updateWalletBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.STATUS_PENDING_TEXT,
    },
    payoutCompletedBox: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderRadius: 12,
        padding: 14,
        gap: 6,
    },
    payoutCompletedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    payoutCompletedTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.SUCCESS,
    },
    payoutCompletedSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    viewProofBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.WHITE,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    viewProofBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    disputedAlertBox: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        padding: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
    },
    disputedAlertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    disputedAlertTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    disputedAlertText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontStyle: 'italic',
        lineHeight: 16,
    },
    disputedChatNoticeText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 15,
        marginTop: 2,
    },
    viewDisputedProofBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: '#FECACA',
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    viewDisputedProofBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    disputedActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    disputedLateNoticeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#FEE2E2',
    },
    disputedLateNoticeText: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        flex: 1,
        minWidth: 140,
    },
    confirmReceivedSmallBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.SUCCESS,
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    confirmReceivedSmallBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    handshakeActionRow: {
        marginTop: 8,
        gap: 8,
    },
    confirmReceivedPrimaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.SUCCESS,
        paddingVertical: 12,
        borderRadius: 10,
    },
    confirmReceivedPrimaryBtnText: {
        color: Colors.WHITE,
        fontSize: 13,
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
        paddingVertical: 11,
        borderRadius: 10,
    },
    disputeOutlineBtnText: {
        color: Colors.ERROR,
        fontSize: 13,
        fontWeight: 'bold',
    },
    maxDisputeReachedBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 10,
        borderRadius: 8,
    },
    maxDisputeReachedText: {
        flex: 1,
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 15,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    disputeModalCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 420,
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
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 17,
    },
    disputeTextInput: {
        minHeight: 96,
    },
    disputeModalChatNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.PRIMARY_LIGHT,
        padding: 10,
        borderRadius: 8,
    },
    disputeModalChatNoticeText: {
        flex: 1,
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 15,
    },
    disputeModalActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    disputeCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    disputeCancelBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    disputeSubmitBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.ERROR,
    },
    disputeSubmitBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    btnDisabled: {
        opacity: 0.5,
    },
});

export default CancellationCard;
