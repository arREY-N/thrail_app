import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomInfoRow from '@/src/components/CustomInfoRow';
import CustomText from '@/src/components/CustomText';
import ExpandableText from '@/src/components/ExpandableText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { IPayment } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { SelectedFile } from '@/src/core/repositories/fileRepository';
import { CANCELLATION_APPROVE_SUGGESTIONS, CANCELLATION_DECLINE_REASONS } from '@/src/features/Admin/utils/reviewMessages';
import { formatBookingDate } from '@/src/utils/dateFormatter';

/**
 * Props for AdminCancellationCard.
 * @param status - Current workflow status of the booking.
 * @param cancellation - Optional cancellation request object.
 * @param cancellationReason - Reason submitted by the hiker or organizer.
 * @param declineReason - Decline explanation/adminNote provided by organizer if declined.
 * @param totalAmountPaid - Total captured payment amount for the booking.
 * @param requestedAt - Optional timestamp when the cancellation was requested.
 * @param cancelledBy - Optional name/role of who cancelled the booking.
 * @param onRevert - Optional callback when organizer reverts a pending admin-initiated cancellation.
 * @param isReverting - Whether the revert operation is currently processing.
 */
export interface AdminCancellationCardProps {
    status: string;
    cancellation?: Cancellation | null;
    cancellationReason?: string;
    declineReason?: string;
    totalAmountPaid: number;
    totalRefundedAmount?: number;
    requestedAt?: Date | null;
    cancelledBy?: string;
    onRevert?: () => void;
    isReverting?: boolean;
    onRefundClick?: () => void;
    onCloseWithoutRefundClick?: () => void;
    onUploadRefundProof?: (file: SelectedFile) => Promise<boolean | void>;
    isUploadingProof?: boolean;
    onApproveWithManualRefund?: (amount: number) => Promise<void> | void;
    payments?: IPayment<Date>[];
    isPayMongo?: boolean;
    onApproveClick?: () => void;
    onCancelApproveClick?: () => void;
    onSubmitApproveClick?: (note: string, file?: SelectedFile | null) => void;
    isApproving?: boolean;
    approveInputText?: string;
    onApproveInputChange?: (text: string) => void;
    selectedReceiptFile?: SelectedFile | null;
    onSelectReceiptFile?: (file: SelectedFile | null) => void;
    onDeclineClick?: () => void;
    onCancelDeclineClick?: () => void;
    onSubmitDeclineClick?: () => void;
    isDeclining?: boolean;
    declineInputText?: string;
    onDeclineInputChange?: (text: string) => void;
}

/**
 * AdminCancellationCard — Renders contextual cancellation details within the Admin ReviewScreen.
 */
const AdminCancellationCard: React.FC<AdminCancellationCardProps> = ({
    status,
    cancellation,
    cancellationReason,
    declineReason,
    totalAmountPaid,
    totalRefundedAmount = 0,
    requestedAt,
    cancelledBy,
    onRevert,
    isReverting = false,
    onRefundClick,
    onCloseWithoutRefundClick,
    onUploadRefundProof,
    isUploadingProof = false,
    onApproveWithManualRefund,
    payments,
    isPayMongo,
    onApproveClick,
    onCancelApproveClick,
    onSubmitApproveClick,
    isApproving,
    approveInputText,
    onApproveInputChange,
    selectedReceiptFile,
    onSelectReceiptFile,
    onDeclineClick,
    onCancelDeclineClick,
    onSubmitDeclineClick,
    isDeclining = false,
    declineInputText = '',
    onDeclineInputChange,
}) => {
    const [previewAdminProof, setPreviewAdminProof] = useState<string | null>(null);
    const [localIsApproving, setLocalIsApproving] = useState(false);
    const [localApproveText, setLocalApproveText] = useState('');
    const [localSelectedReceipt, setLocalSelectedReceipt] = useState<SelectedFile | null>(null);

    const resolvedIsApproving = isApproving !== undefined ? isApproving : localIsApproving;
    const resolvedApproveText = approveInputText !== undefined ? approveInputText : localApproveText;
    const resolvedSelectedReceipt = selectedReceiptFile !== undefined ? selectedReceiptFile : localSelectedReceipt;

    const handleStartApprove = () => {
        if (onApproveClick) {
            onApproveClick();
        } else {
            setLocalIsApproving(true);
        }
    };

    const handleCancelApprove = () => {
        setLocalIsApproving(false);
        setLocalApproveText('');
        setLocalSelectedReceipt(null);
        if (onSelectReceiptFile) onSelectReceiptFile(null);
        if (onCancelApproveClick) onCancelApproveClick();
    };

    const handleSelectReceiptInForm = async () => {
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                const file: SelectedFile = {
                    uri: asset.uri,
                    name: asset.fileName || `refund_proof_${Date.now()}.jpg`,
                    mimeType: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize,
                };
                setLocalSelectedReceipt(file);
                if (onSelectReceiptFile) onSelectReceiptFile(file);
            }
        } catch (err) {
            console.error('Image picker error:', err);
        }
    };

    const handleClearReceipt = () => {
        setLocalSelectedReceipt(null);
        if (onSelectReceiptFile) onSelectReceiptFile(null);
    };

    const handleSubmitApprove = () => {
        if (onSubmitApproveClick) {
            onSubmitApproveClick(resolvedApproveText, resolvedSelectedReceipt);
        }
    };

    const renderApproveForm = () => {
        const hasReceipt = Boolean(resolvedSelectedReceipt);
        const hasNote = Boolean(resolvedApproveText?.trim());
        const canSubmit = hasReceipt || hasNote;

        return (
            <View style={styles.approveFormContainer}>
                <CustomFeedbackInput
                    label="Admin Message / Note"
                    helperText="Upload a refund receipt proof or enter an admin note (e.g., approved without refund) to proceed."
                    placeholder="Enter message (e.g., approved without refund)..."
                    value={resolvedApproveText}
                    onChangeText={onApproveInputChange || setLocalApproveText}
                    suggestions={[...CANCELLATION_APPROVE_SUGGESTIONS]}
                    variant="primary"
                />

                <View style={styles.receiptSectionContainer}>
                    <CustomText variant="caption" style={styles.receiptSectionLabel}>
                        REFUND RECEIPT PROOF (OPTIONAL IF NO REFUND)
                    </CustomText>

                    {resolvedSelectedReceipt ? (
                        <View style={styles.docUploadCard}>
                            <View style={styles.docCardHeaderRow}>
                                <View style={styles.docUploadInfo}>
                                    <View style={[styles.docIconWrapper, styles.docIconWrapperSuccess]}>
                                        <CustomIcon library="Feather" name="check" size={18} color={Colors.SUCCESS} />
                                    </View>
                                    <View style={styles.docTextContainer}>
                                        <CustomText variant="label" style={styles.docName} numberOfLines={1}>
                                            {resolvedSelectedReceipt.name || 'Refund Receipt'}
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.docSubtitle} numberOfLines={1}>
                                            {resolvedSelectedReceipt.size
                                                ? `${(resolvedSelectedReceipt.size / 1024).toFixed(1)} KB • Attached`
                                                : 'Attached • Ready to submit'}
                                        </CustomText>
                                    </View>
                                </View>

                                <View style={styles.docActionContainer}>
                                    <TouchableOpacity
                                        style={styles.docViewBtn}
                                        onPress={() => setPreviewAdminProof(resolvedSelectedReceipt.uri)}
                                        activeOpacity={0.7}
                                    >
                                        <CustomText variant="caption" style={styles.docViewBtnText}>
                                            View
                                        </CustomText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.docRemoveBtn}
                                        onPress={handleClearReceipt}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <CustomIcon library="Feather" name="x" size={15} color={Colors.TEXT_SECONDARY} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.docUploadCard}>
                            <View style={styles.docCardHeaderRow}>
                                <View style={styles.docUploadInfo}>
                                    <View style={[styles.docIconWrapper, styles.docIconWrapperPending]}>
                                        <CustomIcon library="Feather" name="file-text" size={18} color={Colors.PRIMARY} />
                                    </View>
                                    <View style={styles.docTextContainer}>
                                        <CustomText variant="label" style={styles.docName}>
                                            Refund Receipt
                                        </CustomText>
                                        <CustomText variant="caption" style={styles.docSubtitle}>
                                            Attach GCash / Maya transfer screenshot
                                        </CustomText>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.docUploadBtn}
                                    onPress={handleSelectReceiptInForm}
                                    activeOpacity={0.7}
                                >
                                    <CustomText variant="caption" style={styles.docUploadBtnText}>
                                        Upload
                                    </CustomText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.twoColumnRow}>
                    <CustomButton
                        title="Cancel"
                        variant="outline"
                        size="md"
                        onPress={handleCancelApprove}
                        style={styles.twoColumnBtn}
                        disabled={isUploadingProof}
                    />
                    <CustomButton
                        title={hasReceipt ? "Submit & Refund" : "Approve Cancellation"}
                        variant="primary"
                        size="md"
                        icon={hasReceipt ? "upload" : "check"}
                        iconLibrary="Feather"
                        onPress={handleSubmitApprove}
                        style={styles.twoColumnBtn}
                        disabled={!canSubmit || isUploadingProof}
                        isLoading={isUploadingProof}
                    />
                </View>
            </View>
        );
    };



    const isCancelledByAdmin =
        cancellation?.cancelledBy === 'admin' || cancelledBy === 'admin';

    const isPending = cancellation
        ? cancellation.status === 'pending'
        : status === 'for-cancellation';
    const isDeclined = cancellation
        ? cancellation.status === 'rejected'
        : status === 'cancellation-rejected';

    const resolvedIsPayMongo = isPayMongo ?? payments?.some(p => p.gateway === 'paymongo');
    const isManualRefund = !resolvedIsPayMongo && (PAYMENT_CONFIG.PROVIDER === 'manual_qr' || payments?.some(p => p.gateway === 'manual_qr'));

    const isRefundDisputed = isManualRefund && (
        cancellation?.handshakeStep === 'refund_disputed' ||
        cancellation?.status === 'refund_disputed'
    );
    const isAwaitingUserConfirmation = isManualRefund && (
        cancellation?.handshakeStep === 'awaiting_user_confirmation' ||
        (Boolean(cancellation?.adminRefundReceiptUrl) && cancellation?.handshakeStep !== 'completed' && status !== 'refunded' && !isRefundDisputed)
    );
    const isPaid = totalAmountPaid > 0 || totalRefundedAmount > 0;
    const isDirectCancellation = !cancellation && status === 'cancelled' && totalAmountPaid === 0;

    const isApproved = !isDirectCancellation && (
        cancellation?.status === 'approved' ||
        (status === 'cancelled' && Boolean(cancellation)) ||
        status === 'refund' ||
        status === 'refunded'
    );

    const hasRefund = (typeof cancellation?.refundAmount === 'number' && cancellation.refundAmount > 0) || totalRefundedAmount > 0;
    const isApprovedWithoutRefund = isApproved && (
        cancellation?.refundDecision === 'no_refund' ||
        (!hasRefund && !cancellation?.adminRefundReceiptUrl && (cancellation?.status === 'approved' || status === 'cancelled'))
    );

    const isRefundComplete = !isApprovedWithoutRefund && (resolvedIsPayMongo
        ? (totalRefundedAmount > 0 || status === 'refunded')
        : (!isAwaitingUserConfirmation && !isRefundDisputed && (cancellation?.handshakeStep === 'completed' || cancellation?.status === 'refund_completed' || status === 'refunded')));

    const isCancelled =
        (status === 'cancelled' && totalRefundedAmount === 0) ||
        (cancellation?.status === 'approved' && totalRefundedAmount === 0 && !cancellation?.refundAmount);

    if (!isPending && !isDeclined && !isRefundComplete && !isCancelled && !cancellation?.refundAmount && !isRefundDisputed && !isAwaitingUserConfirmation && !isApprovedWithoutRefund) {
        return null;
    }

    const isAwaitingRefundDecision = isManualRefund && isApproved && isPaid && !isApprovedWithoutRefund && !isRefundComplete && !isRefundDisputed && !isAwaitingUserConfirmation && (cancellation?.handshakeStep === 'awaiting_admin_refund_decision' || (!cancellation?.handshakeStep && !cancellation?.refundDecision));
    const isAwaitingWallet = isManualRefund && isApproved && isPaid && !isApprovedWithoutRefund && !isRefundComplete && !isRefundDisputed && !isAwaitingUserConfirmation && (cancellation?.handshakeStep === 'awaiting_user_wallet' || (!cancellation?.userWallet && !isAwaitingRefundDecision));
    const isAwaitingPayout = isManualRefund && isApproved && isPaid && !isApprovedWithoutRefund && !isRefundComplete && Boolean(cancellation?.userWallet) && (!cancellation?.adminRefundReceiptUrl || isRefundDisputed);

    const headerTitle = isDirectCancellation
        ? 'Reservation Cancelled'
        : isRefundDisputed
            ? `Refund Disputed by Hiker (Attempt ${cancellation?.disputeCount || 1}/3)`
            : isAwaitingUserConfirmation
                ? 'Payout Proof Uploaded — Awaiting Hiker Confirmation'
                : isApproved
                    ? (isApprovedWithoutRefund
                        ? 'Cancellation Approved (No Refund)'
                        : (isRefundComplete
                            ? 'Cancellation Approved & Refunded'
                            : (isAwaitingPayout
                                ? 'Cancellation Approved — Send Payout'
                                : (isAwaitingWallet
                                    ? 'Cancellation Approved — Awaiting Hiker Wallet'
                                    : (isAwaitingRefundDecision ? 'Awaiting Refund Decision' : (isCancelledByAdmin ? 'Hike Cancelled by Organizer' : 'Cancellation Approved'))))))
                    : isCancelledByAdmin
                        ? 'Hike Cancelled by Organizer'
                        : isDeclined
                            ? 'Cancellation Request Declined'
                            : 'Cancellation Review';

    const headerIcon = isDirectCancellation
        ? 'x-circle'
        : isCancelledByAdmin && !isApproved
            ? 'slash'
            : isDeclined
                ? 'x-circle'
                : isRefundDisputed
                    ? 'alert-triangle'
                    : isAwaitingUserConfirmation
                        ? 'clock'
                        : isApproved
                            ? (isApprovedWithoutRefund || isRefundComplete ? 'check-circle' : 'clock')
                            : 'alert-triangle';

    const iconColor = isDirectCancellation || (isCancelledByAdmin && !isApproved) || isDeclined || isPending || isRefundDisputed
        ? Colors.ERROR
        : (isApprovedWithoutRefund || isRefundComplete ? Colors.SUCCESS : '#B45309');

    const subtitleText = isDirectCancellation
        ? 'Booking cancelled by Hiker. Reserved slot released.'
        : isRefundDisputed
            ? `Hiker reported not receiving the refund payout (Attempt ${cancellation?.disputeCount || 1}/3). Please check the recipient number below, send payment, and upload a new receipt proof.`
            : isAwaitingUserConfirmation
                ? 'Refund receipt proof uploaded. Waiting for hiker to inspect and confirm receipt.'
                : isApprovedWithoutRefund
                    ? 'Cancellation approved without refund. Reserved slot released.'
                    : isCancelledByAdmin
                        ? (isPending
                            ? 'You cancelled this reservation. Hiker has been notified.'
                            : isAwaitingPayout
                                ? 'Cancellation approved. Hiker submitted e-wallet details — send payout below.'
                                : isAwaitingWallet
                                    ? `Cancellation approved with refund of ₱${(cancellation?.refundAmount || totalAmountPaid).toFixed(2)}. Waiting for hiker to submit wallet.`
                                    : isAwaitingRefundDecision
                                        ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                                            ? 'The hiker accepted your cancellation. Please issue a refund or finalize without refund if resolved offline.'
                                            : 'The hiker accepted your cancellation. Please issue a refund via PayMongo or finalize without refund if resolved offline.')
                                        : isRefundComplete
                                            ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                                                ? 'Hike cancelled by organizer. Refund issued.'
                                                : 'Hike cancelled by organizer. Refund issued via PayMongo.')
                                            : 'Booking cancelled by organizer. Reserved slot released.')
                        : (isPending
                            ? 'Hiker requested to cancel this reservation. Review reason and inventory status.'
                            : isDeclined
                                ? 'Organizer declined this request. Hiker can submit an appeal.'
                                : isAwaitingRefundDecision
                                    ? 'Cancellation approved. Please select a refund option below to complete resolution.'
                                    : isRefundComplete
                                        ? (PAYMENT_CONFIG.PROVIDER === 'manual_qr'
                                            ? 'Cancellation approved and refund issued.'
                                            : 'Cancellation approved and refund issued via PayMongo.')
                                        : 'Cancellation approved. Reserved slot released.');

    const resolvedReason = isDirectCancellation
        ? undefined
        : (cancellation?.reason || cancellationReason);
    const resolvedDeclineReason =
        declineReason || cancellation?.adminNote;
    const resolvedTimestamp =
        requestedAt || cancellation?.createdAt;

    const reasonBoxLabel = isCancelledByAdmin
        ? "ORGANIZER'S CANCELLATION REASON"
        : "HIKER'S SUBMITTED REASON";

    return (
        <View style={styles.cardContainer}>
            {/* Header Row: Title & Icon on Left, Approved Badge on Right */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <CustomIcon
                        library="Feather"
                        name={headerIcon}
                        size={16}
                        color={iconColor}
                    />
                    <CustomText style={styles.headerTitle}>
                        {headerTitle}
                    </CustomText>
                </View>

                {isApproved && (
                    <View style={[
                        styles.approvedBadge,
                        isAwaitingRefundDecision && styles.actionRequiredBadge
                    ]}>
                        <CustomIcon
                            library="Feather"
                            name={isAwaitingRefundDecision ? "alert-circle" : "check"}
                            size={12}
                            color={isAwaitingRefundDecision ? "#B45309" : Colors.SUCCESS}
                        />
                        <CustomText style={[
                            styles.approvedBadgeText,
                            isAwaitingRefundDecision && styles.actionRequiredBadgeText
                        ]}>
                            {isAwaitingRefundDecision
                                ? (isCancelledByAdmin ? 'ACCEPTED BY HIKER' : 'NEEDS REFUND DECISION')
                                : 'APPROVED'}
                        </CustomText>
                    </View>
                )}

                {isDeclined && (
                    <View style={styles.declinedBadge}>
                        <CustomIcon
                            library="Feather"
                            name="x-circle"
                            size={12}
                            color={Colors.ERROR}
                        />
                        <CustomText style={styles.declinedBadgeText}>
                            DECLINED
                        </CustomText>
                    </View>
                )}
            </View>

            <CustomText variant="caption" style={styles.headerSubtitle}>
                {subtitleText}
            </CustomText>

            {/* Reason Box (Hiker or Organizer) */}
            {resolvedReason ? (
                <View style={styles.infoBox}>
                    <View style={styles.infoBoxHeader}>
                        <CustomText variant="caption" style={styles.infoBoxLabel}>
                            {reasonBoxLabel}
                        </CustomText>
                        {resolvedTimestamp && (
                            <CustomText variant="caption" style={styles.infoBoxTimestamp}>
                                {formatBookingDate(resolvedTimestamp, null, true)}
                            </CustomText>
                        )}
                    </View>
                    <ExpandableText
                        text={resolvedReason}
                        quote={true}
                        textStyle={styles.infoBoxText}
                        characterLimit={160}
                        arrowColor={Colors.TEXT_PRIMARY}
                    />
                </View>
            ) : null}

            {/* Organizer Decline Reason Box (if declined) */}
            {isDeclined && resolvedDeclineReason ? (
                <View style={[styles.infoBox, styles.declineBox]}>
                    <View style={styles.infoBoxHeader}>
                        <CustomText variant="caption" style={styles.declineBoxLabel}>
                            ORGANIZER&apos;S DECLINE NOTE
                        </CustomText>
                    </View>
                    <ExpandableText
                        text={resolvedDeclineReason}
                        quote={true}
                        textStyle={styles.declineBoxText}
                        characterLimit={160}
                        arrowColor={Colors.ERROR}
                    />
                </View>
            ) : null}

            {/* Organizer Approval Note / Message (if approved and note exists) */}
            {isApproved && Boolean(cancellation?.adminNote) ? (
                <View style={[styles.infoBox, styles.approveNoteBox]}>
                    <View style={styles.infoBoxHeader}>
                        <CustomText variant="caption" style={styles.approveNoteBoxLabel}>
                            ORGANIZER&apos;S NOTE
                        </CustomText>
                    </View>
                    <ExpandableText
                        text={cancellation?.adminNote || ''}
                        quote={true}
                        textStyle={styles.approveNoteBoxText}
                        characterLimit={160}
                        arrowColor={Colors.PRIMARY}
                    />
                </View>
            ) : null}

            {/* Financial & Inventory Impact Metrics Row */}
            {(() => {
                const resolvedRefunded = typeof cancellation?.refundAmount === 'number' && cancellation.refundAmount > 0
                    ? cancellation.refundAmount
                    : totalRefundedAmount;

                return (
                    <View style={styles.impactRow}>
                        <View style={styles.impactItem}>
                            <CustomText variant="caption" style={styles.impactLabel}>
                                PAYMENT CAPTURED
                            </CustomText>
                            <CustomText style={styles.impactValue}>
                                {totalAmountPaid > 0
                                    ? `₱${totalAmountPaid.toFixed(2)}`
                                    : (resolvedRefunded > 0
                                        ? `₱${resolvedRefunded.toFixed(2)} (Refunded)`
                                        : '₱0.00 (Unpaid)')}
                            </CustomText>
                        </View>
                        {resolvedRefunded > 0 && (
                            <>
                                <View style={styles.impactDivider} />
                                <View style={styles.impactItem}>
                                    <CustomText variant="caption" style={[styles.impactLabel, { color: Colors.ERROR }]}>
                                        AMOUNT REFUNDED
                                    </CustomText>
                                    <CustomText style={[styles.impactValue, { color: Colors.ERROR }]}>
                                        ₱{resolvedRefunded.toFixed(2)}
                                    </CustomText>
                                </View>
                            </>
                        )}
                        <View style={styles.impactDivider} />
                        <View style={styles.impactItem}>
                            <CustomText variant="caption" style={styles.impactLabel}>
                                SLOT STATUS
                            </CustomText>
                            <CustomText
                                style={[
                                    styles.impactValue,
                                    isPending ? styles.slotPendingText : styles.slotReleasedText,
                                ]}
                            >
                                {isPending ? 'Held (Pending)' : 'Released to Tour'}
                            </CustomText>
                        </View>
                    </View>
                );
            })()}

            {/* Manual QR Handshake: Dispute Alert Banner */}
            {isManualRefund && isRefundDisputed && (
                <View style={styles.disputeAlertBox}>
                    <View style={styles.disputeAlertHeader}>
                        <CustomIcon library="Feather" name="alert-triangle" size={18} color={Colors.ERROR} />
                        <CustomText style={styles.disputeAlertTitle}>
                            Refund Disputed by Hiker (Attempt {cancellation?.disputeCount || 1}/3)
                        </CustomText>
                    </View>
                    <CustomText style={styles.disputeAlertSubtitle}>
                        The hiker reported that they did not receive the refund payout.
                    </CustomText>

                    {Boolean(cancellation?.disputeReason) && (
                        <View style={styles.disputeReasonBox}>
                            <CustomText variant="caption" style={styles.disputeReasonLabel}>
                                HIKER&apos;S DISPUTE REASON
                            </CustomText>
                            <CustomText style={styles.disputeReasonText}>
                                &ldquo;{cancellation?.disputeReason}&rdquo;
                            </CustomText>
                        </View>
                    )}

                    <CustomText style={styles.disputeInstructions}>
                        Please verify the hiker&apos;s GCash/Maya number below, transfer the funds if needed, and upload a new receipt proof to re-initiate confirmation. The hiker is kept in the tour group chat so you can also message them directly.
                    </CustomText>
                </View>
            )}

            {/* Manual QR Handshake: Uploaded Proof Display (Awaiting User Confirmation) */}
            {isManualRefund && isAwaitingUserConfirmation && !isRefundDisputed && (
                <View style={styles.awaitingConfirmationBox}>
                    <View style={styles.awaitingConfirmationHeader}>
                        <CustomIcon library="Feather" name="clock" size={16} color={Colors.STATUS_PENDING_TEXT} />
                        <CustomText style={styles.awaitingConfirmationTitle}>
                            Refund Proof Uploaded — Awaiting Hiker Confirmation
                        </CustomText>
                    </View>
                    <CustomText variant="caption" style={styles.awaitingConfirmationSubtitle}>
                        Refund receipt of ₱{(cancellation?.refundAmount || totalAmountPaid).toFixed(2)} was uploaded. Waiting for the hiker to inspect and confirm receipt.
                    </CustomText>
                    {cancellation?.adminRefundReceiptUrl && (
                        <TouchableOpacity
                            style={styles.viewProofBtn}
                            onPress={() => setPreviewAdminProof(cancellation.adminRefundReceiptUrl || null)}
                            activeOpacity={0.8}
                        >
                            <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                            <CustomText style={styles.viewProofBtnText}>View Uploaded Receipt Proof</CustomText>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Manual QR Handshake: Refund Completed & Confirmed Display */}
            {isManualRefund && isRefundComplete && cancellation?.adminRefundReceiptUrl && (
                <View style={styles.manualRefundAdminBox}>
                    <View style={styles.manualRefundHeader}>
                        <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                        <CustomText style={styles.manualRefundSuccessTitle}>
                            Refund Completed & Confirmed by Hiker
                        </CustomText>
                    </View>
                    <CustomText variant="caption" style={styles.manualRefundSubtitle}>
                        Hiker confirmed receipt of ₱{(cancellation.refundAmount || totalAmountPaid).toFixed(2)}. Resolution complete.
                    </CustomText>
                    <TouchableOpacity
                        style={styles.viewProofBtn}
                        onPress={() => setPreviewAdminProof(cancellation.adminRefundReceiptUrl || null)}
                        activeOpacity={0.8}
                    >
                        <CustomIcon library="Feather" name="eye" size={14} color={Colors.PRIMARY} />
                        <CustomText style={styles.viewProofBtnText}>View Refund Receipt Proof</CustomText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Manual QR Handshake: Hiker Wallet Details (hidden if approved without refund) */}
            {isManualRefund && !isDeclined && !isApprovedWithoutRefund && cancellation?.userWallet && (!cancellation?.adminRefundReceiptUrl || isRefundDisputed || isPending) && (
                <View style={[styles.walletDetailsAdminBox, { marginTop: 10 }]}>
                    <View style={styles.manualRefundHeader}>
                        <CustomIcon library="Feather" name="credit-card" size={16} color={Colors.PRIMARY} />
                        <CustomText style={styles.walletDetailsTitle}>
                            Hiker E-Wallet for Refund
                        </CustomText>
                    </View>
                    <CustomInfoRow
                        label="Provider"
                        value={cancellation.userWallet.walletType}
                        compact={true}
                    />
                    <CustomInfoRow
                        label="Mobile Number"
                        value={cancellation.userWallet.accountNumber}
                        enableCopy={true}
                        compact={true}
                    />
                    <CustomInfoRow
                        label="Account Name"
                        value={cancellation.userWallet.accountName || 'N/A'}
                        compact={true}
                    />
                    <CustomInfoRow
                        label="Amount to Send"
                        value={`₱${(cancellation.refundAmount || totalAmountPaid).toFixed(2)}`}
                        compact={true}
                        isLast={true}
                        valueStyle={{ color: Colors.ERROR, fontWeight: 'bold' }}
                    />
                </View>
            )}

            {/* Manual QR Post-Approval / Disputed: Direct Refund Receipt Upload Card (hidden if approved without refund) */}
            {isManualRefund && !isPending && !isDeclined && !isApprovedWithoutRefund && cancellation?.userWallet && (!cancellation?.adminRefundReceiptUrl || isRefundDisputed) && (
                <View style={{ marginTop: 10 }}>
                    <View style={styles.docUploadCard}>
                        <View style={styles.docCardHeaderRow}>
                            <View style={styles.docUploadInfo}>
                                <View style={[styles.docIconWrapper, resolvedSelectedReceipt ? styles.docIconWrapperSuccess : styles.docIconWrapperPending]}>
                                    <CustomIcon
                                        library="Feather"
                                        name={resolvedSelectedReceipt ? "check" : "file-text"}
                                        size={18}
                                        color={resolvedSelectedReceipt ? Colors.SUCCESS : Colors.PRIMARY}
                                    />
                                </View>
                                <View style={styles.docTextContainer}>
                                    <CustomText variant="label" style={styles.docName} numberOfLines={1}>
                                        {resolvedSelectedReceipt ? (resolvedSelectedReceipt.name || 'Refund Receipt') : 'Refund Receipt'}
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.docSubtitle} numberOfLines={1}>
                                        {resolvedSelectedReceipt
                                            ? `${((resolvedSelectedReceipt.size || 0) / 1024).toFixed(1)} KB • Attached`
                                            : 'Attach GCash / Maya transfer screenshot'}
                                    </CustomText>
                                </View>
                            </View>

                            {resolvedSelectedReceipt ? (
                                <View style={styles.docActionContainer}>
                                    <TouchableOpacity
                                        style={styles.docViewBtn}
                                        onPress={() => setPreviewAdminProof(resolvedSelectedReceipt.uri)}
                                        activeOpacity={0.7}
                                    >
                                        <CustomText variant="caption" style={styles.docViewBtnText}>
                                            View
                                        </CustomText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.docRemoveBtn}
                                        onPress={handleClearReceipt}
                                        activeOpacity={0.7}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <CustomIcon library="Feather" name="x" size={15} color={Colors.TEXT_SECONDARY} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.docUploadBtn}
                                    onPress={handleSelectReceiptInForm}
                                    activeOpacity={0.7}
                                    disabled={isUploadingProof}
                                >
                                    <CustomText variant="caption" style={styles.docUploadBtnText}>
                                        Upload
                                    </CustomText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {resolvedSelectedReceipt && (
                        <CustomButton
                            title={isUploadingProof ? "Uploading Proof..." : (isRefundDisputed ? "Re-Submit Refund Proof" : "Submit Refund Proof")}
                            variant="primary"
                            size="md"
                            icon="upload"
                            iconLibrary="Feather"
                            onPress={handleSubmitApprove}
                            isLoading={isUploadingProof}
                            style={{ marginTop: 10 }}
                        />
                    )}
                </View>
            )}

            {/* Pending Hiker Cancellation Review Actions */}
            {isPending && !isCancelledByAdmin && !isDeclined && (
                <View style={{ marginTop: 12 }}>
                    {isDeclining ? (
                        <View style={{ marginTop: 4 }}>
                            <CustomFeedbackInput
                                label="Decline Reason *"
                                helperText="Explain why the cancellation request is declined. The hiker will receive this message and can appeal."
                                placeholder="Explain why cancellation cannot be approved..."
                                value={declineInputText}
                                onChangeText={onDeclineInputChange || (() => { })}
                                suggestions={[...CANCELLATION_DECLINE_REASONS]}
                                variant="danger"
                            />
                            <View style={styles.twoColumnRow}>
                                <CustomButton
                                    title="Cancel"
                                    variant="outline"
                                    size="md"
                                    onPress={onCancelDeclineClick}
                                    style={styles.twoColumnBtn}
                                />
                                <CustomButton
                                    title="Submit Decline"
                                    variant="destructive"
                                    size="md"
                                    onPress={onSubmitDeclineClick}
                                    style={styles.twoColumnBtn}
                                    disabled={!declineInputText?.trim()}
                                />
                            </View>
                        </View>
                    ) : resolvedIsApproving ? (
                        <View style={{ marginTop: 4 }}>
                            {renderApproveForm()}
                        </View>
                    ) : (
                        <View style={styles.twoColumnRow}>
                            {Boolean(onDeclineClick) && (
                                <CustomButton
                                    title="Decline Cancellation"
                                    variant="outline"
                                    size="md"
                                    onPress={onDeclineClick}
                                    style={[styles.twoColumnBtn, { borderColor: Colors.ERROR }]}
                                    textStyle={{ color: Colors.ERROR }}
                                />
                            )}
                            <CustomButton
                                title={totalAmountPaid > 0 ? "Approve & Refund" : "Approve Cancellation"}
                                variant="primary"
                                size="md"
                                icon="check"
                                iconLibrary="Feather"
                                onPress={handleStartApprove}
                                style={styles.twoColumnBtn}
                            />
                        </View>
                    )}
                </View>
            )}

            {/* Manual QR Handshake: Waiting for Hiker Wallet Banner */}
            {isManualRefund && cancellation?.handshakeStep === 'awaiting_user_wallet' && !cancellation?.userWallet && (
                <View style={styles.waitingWalletBox}>
                    <View style={styles.waitingWalletLeft}>
                        <CustomIcon library="Feather" name="clock" size={16} color={Colors.STATUS_PENDING_TEXT} />
                        <CustomText style={styles.waitingWalletText}>
                            Refund approved (₱{(cancellation.refundAmount || totalAmountPaid).toFixed(2)}). Waiting for hiker to submit their GCash or Maya wallet.
                        </CustomText>
                    </View>
                    {Boolean(onRefundClick) && (
                        <TouchableOpacity
                            style={styles.changeRefundAmountBtn}
                            onPress={onRefundClick}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="edit-2" size={12} color={Colors.PRIMARY} />
                            <CustomText style={styles.changeRefundAmountBtnText}>
                                Change Amount
                            </CustomText>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Interactive Refund Resolution Banner for Paid Cancellations */}
            {isAwaitingRefundDecision && !cancellation?.userWallet && !cancellation?.adminRefundReceiptUrl && cancellation?.handshakeStep !== 'awaiting_user_wallet' && cancellation?.handshakeStep !== 'awaiting_admin_payout' && cancellation?.handshakeStep !== 'completed' && (
                isManualRefund ? (
                    <View style={styles.actionBanner}>
                        <View style={styles.actionBannerHeader}>
                            <CustomIcon library="Feather" name="alert-circle" size={15} color="#B45309" />
                            <CustomText style={styles.actionBannerTitle}>
                                Action Required: Refund Decision
                            </CustomText>
                        </View>
                        <CustomText variant="caption" style={styles.actionBannerSubtitle}>
                            Select the refund amount to return via manual e-wallet payout, or finalize without refund.
                        </CustomText>
                        <View style={styles.actionBtnRow}>
                            {Boolean(onRefundClick || onApproveWithManualRefund) && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.refundBtn]}
                                    onPress={onRefundClick ? onRefundClick : () => onApproveWithManualRefund && onApproveWithManualRefund(totalAmountPaid)}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="corner-up-left" size={14} color={Colors.WHITE} />
                                    <CustomText style={styles.refundBtnText}>
                                        Choose Refund Amount
                                    </CustomText>
                                </TouchableOpacity>
                            )}
                            {Boolean(onCloseWithoutRefundClick) && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.finalizeBtn]}
                                    onPress={onCloseWithoutRefundClick}
                                    activeOpacity={0.8}
                                >
                                    <CustomIcon library="Feather" name="check" size={14} color={Colors.TEXT_PRIMARY} />
                                    <CustomText style={styles.finalizeBtnText}>
                                        Finalize Without Refund
                                    </CustomText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ) : (
                    (Boolean(onRefundClick) || Boolean(onCloseWithoutRefundClick)) && (
                        <View style={styles.actionBanner}>
                            <View style={styles.actionBannerHeader}>
                                <CustomIcon library="Feather" name="alert-circle" size={15} color="#B45309" />
                                <CustomText style={styles.actionBannerTitle}>
                                    Action Required: Finalize Refund
                                </CustomText>
                            </View>
                            <CustomText variant="caption" style={styles.actionBannerSubtitle}>
                                {isCancelledByAdmin
                                    ? "The hiker has accepted the hike cancellation. Issue a refund via PayMongo or finalize without refund if resolved offline."
                                    : "This reservation cancellation is approved. Issue a refund or finalize without refund to complete resolution."}
                            </CustomText>
                            <View style={styles.actionBtnRow}>
                                {Boolean(onRefundClick) && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.refundBtn]}
                                        onPress={onRefundClick}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon library="Feather" name="corner-up-left" size={14} color={Colors.WHITE} />
                                        <CustomText style={styles.refundBtnText}>
                                            Issue Refund via PayMongo
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                                {Boolean(onCloseWithoutRefundClick) && (
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.finalizeBtn]}
                                        onPress={onCloseWithoutRefundClick}
                                        activeOpacity={0.8}
                                    >
                                        <CustomIcon library="Feather" name="check" size={14} color={Colors.TEXT_PRIMARY} />
                                        <CustomText style={styles.finalizeBtnText}>
                                            Finalize Without Refund
                                        </CustomText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )
                )
            )}

            {/* Optional Revert Cancellation Action for Admin-Initiated Pending Cancellations */}
            {isCancelledByAdmin && isPending && Boolean(onRevert) && (
                <TouchableOpacity
                    style={styles.revertBtn}
                    onPress={onRevert}
                    disabled={isReverting}
                    activeOpacity={0.7}
                >
                    <CustomIcon library="Feather" name="rotate-ccw" size={14} color={Colors.ERROR} />
                    <CustomText style={styles.revertBtnText}>
                        {isReverting ? 'Reverting Cancellation...' : 'Revert Cancellation'}
                    </CustomText>
                </TouchableOpacity>
            )}

            {previewAdminProof && (
                <ImagePreviewModal
                    visible={Boolean(previewAdminProof)}
                    imageUrl={previewAdminProof}
                    onClose={() => setPreviewAdminProof(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 6,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        flexShrink: 1,
    },
    approvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    approvedBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.SUCCESS,
        letterSpacing: 0.5,
    },
    declinedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
    },
    declinedBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.ERROR,
        letterSpacing: 0.5,
    },
    actionRequiredBadge: {
        backgroundColor: '#FEF3C7',
    },
    actionRequiredBadgeText: {
        color: '#B45309',
    },
    headerSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 14,
    },
    infoBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        marginBottom: 12,
    },
    declineBox: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        borderColor: Colors.ERROR_BORDER,
    },
    infoBoxHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        rowGap: 4,
        columnGap: 8,
        marginBottom: 10,
    },
    infoBoxLabel: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.TEXT_SECONDARY,
    },
    declineBoxLabel: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.ERROR,
    },
    infoBoxTimestamp: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
        fontWeight: '500',
    },
    infoBoxText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 20,
    },
    declineBoxText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: Colors.ERROR,
        fontWeight: '500',
        lineHeight: 20,
    },
    approveNoteBox: {
        backgroundColor: Colors.TRAIL_STATUS_ACTIVE_BG,
        borderColor: Colors.TRAIL_STATUS_ACTIVE_BORDER,
    },
    approveNoteBoxLabel: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.PRIMARY,
    },
    approveNoteBoxText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
        lineHeight: 20,
    },
    impactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginTop: 2,
    },
    impactItem: {
        flex: 1,
    },
    impactLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
    },
    impactValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    impactDivider: {
        width: 1,
        height: 28,
        backgroundColor: Colors.GRAY_LIGHT,
        marginHorizontal: 8,
    },
    slotPendingText: {
        color: Colors.ERROR,
    },
    slotReleasedText: {
        color: Colors.PRIMARY,
    },
    revertBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.ERROR,
        backgroundColor: Colors.WHITE,
        marginTop: 12,
    },
    revertBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    actionBanner: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    actionBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    actionBannerTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#92400E',
    },
    actionBannerSubtitle: {
        fontSize: 11,
        color: '#92400E',
        lineHeight: 15,
        marginBottom: 10,
    },
    actionBtnRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 8,
        flex: 1,
        minWidth: 140,
    },
    refundBtn: {
        backgroundColor: Colors.PRIMARY,
    },
    refundBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    finalizeBtn: {
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_MEDIUM,
    },
    finalizeBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    manualRefundAdminBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        padding: 12,
        marginTop: 10,
    },
    manualRefundHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    manualRefundSuccessTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#166534',
    },
    manualRefundSubtitle: {
        fontSize: 11,
        color: '#15803D',
        marginBottom: 8,
    },
    viewProofBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        marginTop: 4,
    },
    viewProofBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    walletDetailsAdminBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        padding: 12,
    },
    walletDetailsTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    twoColumnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
    },
    twoColumnBtn: {
        flex: 1,
    },
    walletFieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    walletLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    walletValue: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    walletAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    waitingWalletBox: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        padding: 12,
        marginTop: 10,
        gap: 8,
    },
    waitingWalletLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 180,
    },
    waitingWalletText: {
        fontSize: 12,
        color: '#92400E',
        flex: 1,
        lineHeight: 16,
    },
    changeRefundAmountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
        marginLeft: 8,
    },
    changeRefundAmountBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    numberCopyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    copyIconBtn: {
        padding: 4,
        borderRadius: 4,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    disputeAlertBox: {
        backgroundColor: '#FEF2F2',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA',
        padding: 12,
        marginTop: 10,
        gap: 6,
    },
    disputeAlertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    disputeAlertTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    disputeAlertSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    disputeReasonBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        padding: 10,
        marginVertical: 4,
    },
    disputeReasonLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.ERROR,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    disputeReasonText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontStyle: 'italic',
        lineHeight: 16,
    },
    disputeInstructions: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 15,
    },
    awaitingConfirmationBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        padding: 12,
        marginTop: 10,
        gap: 6,
    },
    awaitingConfirmationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    awaitingConfirmationTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#92400E',
    },
    awaitingConfirmationSubtitle: {
        fontSize: 12,
        color: '#B45309',
        lineHeight: 16,
    },
    approvedNoteBox: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
    },
    approvedNoteBoxLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        letterSpacing: 0.5,
    },
    approveFormContainer: {
        marginTop: 4,
    },
    receiptSectionContainer: {
        marginTop: 10,
        marginBottom: 12,
    },
    receiptSectionLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    docUploadCard: {
        backgroundColor: Colors.WHITE,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }),
    },
    docCardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    docUploadInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 8,
    },
    docIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    docIconWrapperPending: {
        backgroundColor: '#F0FDF4',
    },
    docIconWrapperSuccess: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    docTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    docName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    docSubtitle: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    docActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    docUploadBtn: {
        paddingVertical: 7,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 68,
        alignItems: 'center',
        backgroundColor: Colors.PRIMARY,
    },
    docUploadBtnText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 12,
    },
    docViewBtn: {
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 20,
        minWidth: 54,
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.SUCCESS,
    },
    docViewBtnText: {
        color: Colors.SUCCESS,
        fontWeight: 'bold',
        fontSize: 12,
    },
    docRemoveBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.BACKGROUND,
    },
});

export default AdminCancellationCard;
