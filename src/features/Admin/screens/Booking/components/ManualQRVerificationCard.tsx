/**
 * @file ManualQRVerificationCard.tsx
 * @description Admin verification card for reviewing hiker manual QR payment receipts,
 * classifying as Full Payment vs Downpayment, rejecting with reason, and settling remaining balances.
 */

import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { formatDate } from '@/src/core/utility/date';

export interface ManualQRVerificationCardProps {
    booking: Booking;
    onVerifyPayment: (classification: 'full' | 'downpayment', note?: string, verifiedAmount?: number) => Promise<void>;
    onRejectPayment: (reason: string) => Promise<void>;
    onSettleBalance: () => Promise<void>;
    isProcessing?: boolean;
}

const REJECTION_SUGGESTIONS = [
    'Receipt image is blurry or unreadable',
    'Payment amount does not match required fee',
    'Invalid or duplicate reference number',
    'Sent to incorrect recipient account',
    'Transaction was cancelled or reversed',
];

export const ManualQRVerificationCard: React.FC<ManualQRVerificationCardProps> = ({
    booking,
    onVerifyPayment,
    onRejectPayment,
    onSettleBalance,
    isProcessing = false,
}) => {
    const [previewVisible, setPreviewVisible] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const payments = booking?.payment || [];
    const manualPayment: IPayment<Date> | undefined = [...payments]
        .reverse()
        .find(p => p.gateway === 'manual_qr' || Boolean(p.receiptUrl));

    const receiptUrl = manualPayment?.receiptUrl;
    const verificationStatus = booking.paymentVerificationStatus || (manualPayment?.status === 'captured' ? (manualPayment.classification === 'downpayment' ? 'downpayment' : 'fully_paid') : (manualPayment?.status === 'rejected' ? 'rejected' : 'pending_verification'));

    const totalPrice = booking.offer?.price || 0;
    const previouslyCaptured = payments.reduce((sum, p) => (p.status === 'captured' ? sum + (p.amount || 0) : sum), 0);
    const remainingBal = booking.remainingBalance !== undefined 
        ? booking.remainingBalance 
        : Math.max(0, totalPrice - previouslyCaptured);

    const isPending = verificationStatus === 'pending_verification' || manualPayment?.status === 'pending';
    const isDownpayment = verificationStatus === 'downpayment' || booking.status === 'downpayment' || (remainingBal > 0 && previouslyCaptured > 0);
    const isFullyPaid = verificationStatus === 'fully_paid' || (booking.status === 'paid' && remainingBal === 0);
    const isRejected = verificationStatus === 'rejected' || manualPayment?.status === 'rejected';

    const defaultAmount = manualPayment?.amount && manualPayment.amount > 0
        ? String(manualPayment.amount)
        : String(remainingBal);

    const [verifiedAmountInput, setVerifiedAmountInput] = useState<string>(defaultAmount);
    const [adminNote, setAdminNote] = useState<string>('');

    const parsedAmount = parseFloat(verifiedAmountInput);
    const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
    const isFullSettlement = isValidAmount && parsedAmount >= remainingBal;
    const remainingAfterVerification = isValidAmount ? Math.max(0, remainingBal - parsedAmount) : remainingBal;

    const renderStatusBadge = () => {
        let label = 'Pending Verification';
        let bg = Colors.STATUS_PENDING_BG;
        let text = Colors.STATUS_PENDING_TEXT;
        let icon = 'clock';

        if (isFullyPaid) {
            label = 'Fully Paid';
            bg = Colors.STATUS_APPROVED_BG;
            text = Colors.SUCCESS;
            icon = 'check-circle';
        } else if (isDownpayment) {
            label = 'Downpayment';
            bg = Colors.STATUS_DOWNPAYMENT_BG;
            text = Colors.STATUS_DOWNPAYMENT_TEXT;
            icon = 'pie-chart';
        } else if (isRejected) {
            label = 'Receipt Rejected';
            bg = Colors.STATUS_CANCELLED_BG;
            text = Colors.STATUS_CANCELLED_TEXT;
            icon = 'x-circle';
        }

        return (
            <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                <CustomIcon library="Feather" name={icon} size={12} color={text} />
                <CustomText style={[styles.statusBadgeText, { color: text }]}>
                    {label.toUpperCase()}
                </CustomText>
            </View>
        );
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerTitleRow}>
                    <CustomIcon library="MaterialCommunityIcons" name="receipt-text-check-outline" size={20} color={Colors.PRIMARY} />
                    <CustomText variant="h3" style={styles.cardTitle}>
                        Manual QR Verification
                    </CustomText>
                </View>
                {renderStatusBadge()}
            </View>

            <View style={styles.divider} />

            {/* Receipt Thumbnail & Details */}
            {receiptUrl ? (
                <View style={styles.receiptContainer}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setPreviewVisible(true)}
                        style={styles.thumbnailWrapper}
                    >
                        <Image source={{ uri: receiptUrl }} style={styles.thumbnail} resizeMode="cover" />
                        <View style={styles.zoomOverlay}>
                            <CustomIcon library="Feather" name="maximize-2" size={16} color={Colors.WHITE} />
                            <CustomText style={styles.zoomText}>View Receipt</CustomText>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.detailsList}>
                        <View style={styles.detailRow}>
                            <CustomText style={styles.detailLabel}>Reported Amount:</CustomText>
                            <CustomText style={styles.detailAmount}>
                                ₱{(manualPayment?.amount || booking.offer?.price || 0).toFixed(2)}
                            </CustomText>
                        </View>

                        <View style={styles.detailRow}>
                            <CustomText style={styles.detailLabel}>Reference No.:</CustomText>
                            <CustomText style={styles.detailValue} selectable={true}>
                                {manualPayment?.referenceCode || manualPayment?.sessionId || 'N/A'}
                            </CustomText>
                        </View>

                        {manualPayment?.paidAt && (
                            <View style={styles.detailRow}>
                                <CustomText style={styles.detailLabel}>Submitted At:</CustomText>
                                <CustomText style={styles.detailValue}>
                                    {formatDate(manualPayment.paidAt)}
                                </CustomText>
                            </View>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.noReceiptBox}>
                    <CustomIcon library="Feather" name="clock" size={24} color={Colors.STATUS_PENDING_TEXT} />
                    <CustomText style={styles.noReceiptText}>
                        Waiting for hiker to upload a payment receipt screenshot.
                    </CustomText>
                </View>
            )}

            {/* Rejection notice if previously rejected */}
            {isRejected && booking.paymentRejectionReason && (
                <View style={styles.rejectedBanner}>
                    <CustomIcon library="Feather" name="alert-triangle" size={16} color={Colors.STATUS_CANCELLED_TEXT} />
                    <View style={{ flex: 1 }}>
                        <CustomText style={styles.rejectedBannerTitle}>Receipt Rejected</CustomText>
                        <CustomText style={styles.rejectedBannerSubtitle}>
                            {booking.paymentRejectionReason}
                        </CustomText>
                    </View>
                </View>
            )}

            {/* Downpayment remaining balance callout */}
            {isDownpayment && !isFullyPaid && (
                <View style={styles.balanceCallout}>
                    <View style={styles.balanceCalloutHeader}>
                        <CustomIcon library="Feather" name="info" size={16} color={Colors.STATUS_DOWNPAYMENT_TEXT} />
                        <CustomText style={styles.balanceCalloutTitle}>
                            Partial Balance Remaining
                        </CustomText>
                    </View>
                    <CustomText style={styles.balanceCalloutText}>
                        The hiker has paid downpayment (₱{previouslyCaptured.toFixed(2)} collected). The remaining balance of{' '}
                        <CustomText style={{ fontWeight: 'bold', color: Colors.TEXT_PRIMARY }}>
                            ₱{remainingBal.toFixed(2)}
                        </CustomText>{' '}
                        must be collected and settled before the booking can be completed.
                    </CustomText>
                    <CustomButton
                        title="Settle Balance (Cash / On-Site)"
                        variant="primary"
                        icon="check-circle"
                        iconLibrary="Feather"
                        onPress={onSettleBalance}
                        isLoading={isProcessing}
                        style={styles.settleBtn}
                    />
                </View>
            )}

            {/* Admin Verification Actions (When Pending) */}
            {isPending && receiptUrl && !isRejecting && (
                <View style={styles.actionsSection}>
                    <CustomText style={styles.actionsTitle}>Verify Amount & Approve</CustomText>
                    <CustomText style={styles.actionsSubtitle}>
                        Inspect the uploaded receipt screenshot and enter the verified amount paid by the hiker.
                    </CustomText>

                    {/* Breakdown mini-panel */}
                    <View style={styles.balancePreviewBox}>
                        <View style={styles.balancePreviewCol}>
                            <CustomText style={styles.previewColLabel}>Total Price</CustomText>
                            <CustomText style={styles.previewColValue}>₱{totalPrice.toFixed(2)}</CustomText>
                        </View>
                        <View style={styles.balancePreviewDivider} />
                        <View style={styles.balancePreviewCol}>
                            <CustomText style={styles.previewColLabel}>Already Paid</CustomText>
                            <CustomText style={[styles.previewColValue, { color: Colors.SUCCESS }]}>₱{previouslyCaptured.toFixed(2)}</CustomText>
                        </View>
                        <View style={styles.balancePreviewDivider} />
                        <View style={styles.balancePreviewCol}>
                            <CustomText style={styles.previewColLabel}>Remaining</CustomText>
                            <CustomText style={[styles.previewColValue, { color: Colors.PRIMARY }]}>₱{remainingBal.toFixed(2)}</CustomText>
                        </View>
                    </View>

                    {/* Verified Amount Input */}
                    <View style={styles.inputWrapper}>
                        <CustomTextInput
                            label="Verified Amount Received (₱) *"
                            placeholder="e.g. 200, 500, 1000"
                            type="numerical"
                            prefix="₱ "
                            value={verifiedAmountInput}
                            onChangeText={(val: string | Date | null) => setVerifiedAmountInput(String(val || ''))}
                        />
                    </View>

                    {/* Live calculation feedback banner */}
                    {isValidAmount && (
                        <View style={[
                            styles.calcFeedbackBox, 
                            isFullSettlement ? styles.calcFeedbackFull : styles.calcFeedbackPartial
                        ]}>
                            <CustomIcon 
                                library="Feather" 
                                name={isFullSettlement ? "check-circle" : "info"} 
                                size={14} 
                                color={isFullSettlement ? Colors.SUCCESS : Colors.STATUS_DOWNPAYMENT_TEXT} 
                            />
                            <CustomText style={[
                                styles.calcFeedbackText, 
                                { color: isFullSettlement ? Colors.SUCCESS : Colors.STATUS_DOWNPAYMENT_TEXT }
                            ]}>
                                {isFullSettlement 
                                    ? `Full payment verified. Booking will be marked as Fully Paid (₱0.00 balance).` 
                                    : `Downpayment / Partial payment. New balance to collect: ₱${remainingAfterVerification.toFixed(2)}`}
                            </CustomText>
                        </View>
                    )}

                    {/* Optional Admin Note */}
                    <View style={styles.inputWrapper}>
                        <CustomTextInput
                            label="Admin Note / Ref No. (Optional)"
                            placeholder="e.g. Verified GCash ref #123456"
                            value={adminNote}
                            onChangeText={(val: string | Date | null) => setAdminNote(String(val || ''))}
                        />
                    </View>

                    {/* Action button */}
                    <CustomButton
                        title={
                            !isValidAmount 
                                ? "Enter Valid Amount"
                                : (isFullSettlement 
                                    ? `Verify Full Payment (₱${parsedAmount.toFixed(2)})`
                                    : `Verify Downpayment (₱${parsedAmount.toFixed(2)})`)
                        }
                        variant="primary"
                        icon="check-circle"
                        iconLibrary="Feather"
                        onPress={() => {
                            if (!isValidAmount) return;
                            onVerifyPayment(
                                isFullSettlement ? 'full' : 'downpayment',
                                adminNote.trim() || undefined,
                                parsedAmount
                            );
                        }}
                        isLoading={isProcessing}
                        disabled={!isValidAmount}
                    />

                    <CustomButton
                        title="Reject / Request Re-upload"
                        variant="outline"
                        icon="x"
                        iconLibrary="Feather"
                        onPress={() => setIsRejecting(true)}
                        style={styles.rejectOutlineBtn}
                        textStyle={{ color: Colors.ERROR }}
                    />
                </View>
            )}

            {/* Inline Rejection Reason Form */}
            {isPending && isRejecting && (
                <View style={styles.rejectionSection}>
                    <CustomFeedbackInput
                        label="Reason for Rejection *"
                        helperText="Provide clear feedback so the hiker knows why their receipt was rejected."
                        placeholder="e.g. Reference number could not be verified..."
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        suggestions={REJECTION_SUGGESTIONS}
                        variant="danger"
                    />
                    <View style={styles.rejectionButtonsRow}>
                        <View style={{ flex: 1 }}>
                            <CustomButton
                                title="Cancel"
                                variant="outline"
                                onPress={() => {
                                    setIsRejecting(false);
                                    setRejectionReason('');
                                }}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <CustomButton
                                title="Confirm Rejection"
                                variant="destructive"
                                onPress={() => onRejectPayment(rejectionReason)}
                                isLoading={isProcessing}
                                disabled={!rejectionReason.trim()}
                            />
                        </View>
                    </View>
                </View>
            )}

            {/* Full Screen Image Preview Modal */}
            {receiptUrl && (
                <ImagePreviewModal
                    visible={previewVisible}
                    imageUrl={receiptUrl}
                    onClose={() => setPreviewVisible(false)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 14,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    receiptContainer: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'flex-start',
    },
    thumbnailWrapper: {
        width: 110,
        height: 140,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    zoomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        gap: 4,
    },
    zoomText: {
        color: Colors.WHITE,
        fontSize: 10,
        fontWeight: '600',
    },
    detailsList: {
        flex: 1,
        gap: 8,
    },
    detailRow: {
        gap: 2,
    },
    detailLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    detailAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    detailValue: {
        fontSize: 13,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    noReceiptBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 14,
        borderRadius: 10,
    },
    noReceiptText: {
        flex: 1,
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
    },
    rejectedBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
    },
    rejectedBannerTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    rejectedBannerSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        marginTop: 2,
    },
    balanceCallout: {
        backgroundColor: Colors.STATUS_DOWNPAYMENT_BG,
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    balanceCalloutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    balanceCalloutTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.STATUS_DOWNPAYMENT_TEXT,
    },
    balanceCalloutText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
    settleBtn: {
        marginTop: 4,
    },
    actionsSection: {
        gap: 10,
        paddingTop: 8,
    },
    actionsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    actionsSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 16,
    },
    balancePreviewBox: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    balancePreviewCol: {
        flex: 1,
        alignItems: 'center',
    },
    balancePreviewDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.GRAY_LIGHT,
    },
    previewColLabel: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    previewColValue: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginTop: 2,
    },
    calcFeedbackBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 10,
        borderRadius: 8,
    },
    calcFeedbackFull: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    calcFeedbackPartial: {
        backgroundColor: Colors.STATUS_DOWNPAYMENT_BG,
    },
    calcFeedbackText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    inputWrapper: {
        width: '100%',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    rejectOutlineBtn: {
        borderColor: Colors.ERROR,
        borderWidth: 1,
    },
    rejectionSection: {
        gap: 12,
        paddingTop: 8,
    },
    rejectionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
});

export default ManualQRVerificationCard;
