import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ExpandableText from '@/src/components/ExpandableText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { Booking } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
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
    onAcceptAdminCancellation,
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

    const isApprovedOrRefunded =
        (cancellation?.status === 'approved' && !isAdminCancelled) ||
        bookingStatus === 'refund' ||
        bookingStatus === 'refunded';

    const isCancelledClosed =
        bookingStatus === 'cancelled' && !isAdminCancelled && !isRejected;

    const isTerminal = isApprovedOrRefunded || isCancelledClosed;
    const router = useRouter();

    const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
    const [isAccepting, setIsAccepting] = useState<boolean>(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(() => !isTerminal);
    const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

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

    const handleExecuteAcceptAdmin = async () => {
        if (!cancellation || !onAcceptAdminCancellation) return;
        setIsAccepting(true);
        try {
            await onAcceptAdminCancellation(cancellation);
        } finally {
            setIsAccepting(false);
        }
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

                            <View style={styles.infoRow}>
                                <CustomIcon
                                    library="Feather"
                                    name="info"
                                    size={15}
                                    color={Colors.TEXT_SECONDARY}
                                />
                                <CustomText variant="caption" style={styles.infoText}>
                                    {totalAmountPaid > 0
                                        ? 'You are eligible for a full refund or can choose to reschedule to an alternative available date.'
                                        : 'This booking is unpaid and has been cancelled. Your reservation spot has been released.'}
                                </CustomText>
                            </View>

                            <View style={styles.actionsColumn}>
                                {cancellation && onAcceptAdminCancellation && cancellation.status !== 'approved' && (
                                    <TouchableOpacity
                                        style={styles.primaryDestructiveBtn}
                                        onPress={handleExecuteAcceptAdmin}
                                        disabled={isAccepting}
                                        activeOpacity={0.8}
                                    >
                                        {isAccepting ? (
                                            <ActivityIndicator size="small" color={Colors.WHITE} />
                                        ) : (
                                            <CustomText style={styles.primaryDestructiveBtnText}>
                                                {totalAmountPaid > 0
                                                    ? 'Accept Cancellation & Request Refund'
                                                    : 'Acknowledge Cancellation'}
                                            </CustomText>
                                        )}
                                    </TouchableOpacity>
                                )}

                                {isPaid && PAYMENT_CONFIG.PROVIDER === 'manual_qr' && (cancellation?.status === 'approved' || cancellation?.handshakeStep === 'awaiting_user_wallet' || cancellation?.handshakeStep === 'awaiting_admin_payout' || cancellation?.handshakeStep === 'completed' || cancellation?.userWallet || cancellation?.adminRefundReceiptUrl) && (
                                    <View style={styles.manualRefundHandshakeBox}>
                                        {cancellation?.adminRefundReceiptUrl ? (
                                            <View style={styles.payoutCompletedBox}>
                                                <View style={styles.payoutCompletedHeader}>
                                                    <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                                                    <CustomText style={styles.payoutCompletedTitle}>
                                                        Refund Payout Sent by Organizer
                                                    </CustomText>
                                                </View>
                                                <CustomText style={styles.payoutCompletedSubtitle}>
                                                    The organizer has sent your refund and uploaded receipt proof.
                                                </CustomText>
                                                <TouchableOpacity
                                                    style={styles.viewProofBtn}
                                                    onPress={() => setPreviewProofUrl(cancellation.adminRefundReceiptUrl || null)}
                                                    activeOpacity={0.8}
                                                >
                                                    <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                                                    <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                                                </TouchableOpacity>
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
                                        ) : (
                                            <View style={styles.needWalletBox}>
                                                <View style={styles.needWalletHeader}>
                                                    <CustomIcon library="Feather" name="alert-circle" size={16} color={Colors.PRIMARY} />
                                                    <CustomText style={styles.needWalletTitle}>
                                                        Action Required: Submit Refund Wallet
                                                    </CustomText>
                                                </View>
                                                <CustomText style={styles.needWalletText}>
                                                    Please submit your GCash or Maya wallet so the organizer can send your refund of ₱{(cancellation?.refundAmount || totalAmountPaid).toFixed(2)}.
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
                                )}

                                {onReschedule && totalAmountPaid > 0 && !cancellation?.adminRefundReceiptUrl && (
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
        const isRefundComplete = Boolean(cancellation?.adminRefundReceiptUrl || bookingStatus === 'refunded');
        const isAwaitingPayout = Boolean(cancellation?.userWallet && !cancellation?.adminRefundReceiptUrl);
        const isAwaitingWallet = Boolean(PAYMENT_CONFIG.PROVIDER === 'manual_qr' && isPaid && !cancellation?.userWallet && !cancellation?.adminRefundReceiptUrl);

        const headerTitle = isPaid
            ? (isRefundComplete
                ? 'Cancellation Approved & Refunded'
                : (isAwaitingPayout
                    ? 'Cancellation Approved — Awaiting Payout'
                    : (isAwaitingWallet
                        ? 'Cancellation Approved — Action Required'
                        : 'Cancellation Approved — Refund In Progress')))
            : 'Cancellation Approved';

        const headerSubtitle = isPaid
            ? (isRefundComplete
                ? 'Refund issued · Booking closed'
                : (isAwaitingPayout
                    ? 'Wallet submitted · Awaiting organizer payout'
                    : (isAwaitingWallet
                        ? 'Please submit your wallet for refund'
                        : 'Refund in progress')))
            : 'Booking closed';

        const headerIcon = isPaid
            ? (isRefundComplete ? 'check-circle' : 'clock')
            : 'check-circle';

        const headerIconColor = isPaid
            ? (isRefundComplete ? Colors.PRIMARY : '#D97706')
            : Colors.PRIMARY;

        const iconBgStyle = isPaid
            ? (isRefundComplete ? styles.iconCircleSuccess : styles.iconCircleWarning)
            : styles.iconCircleSuccess;

        const headerTitleStyle = isPaid
            ? (isRefundComplete ? styles.titleSuccess : styles.titleWarning)
            : styles.titleSuccess;

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
                        <View style={styles.successBox}>
                            <CustomText style={styles.successMessage}>
                                {isPaid
                                    ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                                        ? (isRefundComplete
                                            ? 'Your cancellation request has been approved and refund payout has been sent.'
                                            : (isAwaitingPayout
                                                ? 'Your cancellation request has been approved. The organizer will send your refund to your submitted e-wallet.'
                                                : 'Your cancellation request has been approved by the organizer. Please submit your refund wallet below.'))
                                        : 'Your cancellation request has been approved. The refund transaction is being processed via PayMongo.')
                                    : 'Your cancellation request has been approved. Your reservation has been cancelled and slots released.'}
                            </CustomText>
                            {isPaid && PAYMENT_CONFIG.PROVIDER === 'paymongo' && (
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

                            {isPaid && PAYMENT_CONFIG.PROVIDER === 'manual_qr' && (
                                <View style={styles.manualRefundHandshakeBox}>
                                    {cancellation?.adminRefundReceiptUrl ? (
                                        <View style={styles.payoutCompletedBox}>
                                            <View style={styles.payoutCompletedHeader}>
                                                <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                                                <CustomText style={styles.payoutCompletedTitle}>
                                                    Refund Payout Sent by Organizer
                                                </CustomText>
                                            </View>
                                            <CustomText style={styles.payoutCompletedSubtitle}>
                                                The organizer has sent your refund and uploaded receipt proof.
                                            </CustomText>
                                            <TouchableOpacity
                                                style={styles.viewProofBtn}
                                                onPress={() => setPreviewProofUrl(cancellation.adminRefundReceiptUrl || null)}
                                                activeOpacity={0.8}
                                            >
                                                <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                                                <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                                            </TouchableOpacity>
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
                                    ) : (
                                        <View style={styles.needWalletBox}>
                                            <View style={styles.needWalletHeader}>
                                                <CustomIcon library="Feather" name="alert-circle" size={16} color={Colors.PRIMARY} />
                                                <CustomText style={styles.needWalletTitle}>
                                                    Action Required: Submit Refund Wallet
                                                </CustomText>
                                            </View>
                                            <CustomText style={styles.needWalletText}>
                                                Please submit your GCash or Maya wallet so the organizer can send your refund of ₱{(cancellation?.refundAmount || totalAmountPaid).toFixed(2)}.
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
                            )}
                        </View>

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

    manualRefundHandshakeBox: {
        marginTop: 12,
        gap: 10,
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
});

export default CancellationCard;
