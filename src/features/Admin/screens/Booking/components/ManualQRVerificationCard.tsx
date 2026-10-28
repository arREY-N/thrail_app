/**
 * @file ManualQRVerificationCard.tsx
 * @description Admin verification card for reviewing hiker manual QR payment receipts,
 * classifying as Full Payment vs Downpayment, and rejecting with reason.
 * Features responsive layout for Web and Mobile, adhering to the updated admin wireframe.
 */

import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '@/src/components/CustomButton';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStatusBadge from '@/src/components/CustomStatusBadge';
import CustomText from '@/src/components/CustomText';
import CustomTextInput, { stripEmojis } from '@/src/components/CustomTextInput';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { SelectedFile } from '@/src/core/repositories/fileRepository';
import { formatDateTime } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Sanitizes currency input:
 * 1. Strips all characters except digits and decimal point.
 * 2. Preserves only the first decimal point.
 * 3. Strips leading zeros before whole numbers (e.g. 005 -> 5, preserving 0.).
 * 4. Caps decimal precision to 2 decimal places and whole digits to max 7 digits (max 9999999.99).
 */
export const sanitizeCurrencyInput = (text: string, maxWholeDigits = 7): string => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const dotIndex = cleaned.indexOf('.');
    if (dotIndex !== -1) {
        cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
    }
    const parts = cleaned.split('.');
    let integerPart = parts[0];
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
        integerPart = integerPart.replace(/^0+/, '');
        if (integerPart === '') integerPart = '0';
    }
    if (maxWholeDigits > 0) {
        integerPart = integerPart.slice(0, maxWholeDigits);
    }
    if (parts.length > 1) {
        return `${integerPart}.${parts[1].slice(0, 2)}`;
    }
    return dotIndex !== -1 ? `${integerPart}.` : integerPart;
};

export interface ManualQRVerificationCardProps {
    booking: Booking;
    onVerifyPayment: (classification: 'full' | 'downpayment', note?: string, verifiedAmount?: number) => Promise<void>;
    onRejectPayment: (reason: string) => Promise<void>;
    onSettleBalance?: (options?: { method?: 'cash' | 'manual_qr'; referenceCode?: string; adminNote?: string }) => Promise<void>;
    onUploadOverpaymentProof?: (file: SelectedFile) => Promise<void | string>;
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
    onUploadOverpaymentProof,
    isProcessing = false,
}) => {
    const { isMobile } = useBreakpoints();
    const { showToast } = useToast();
    const [previewVisible, setPreviewVisible] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isUploadingOverpaymentProof, setIsUploadingOverpaymentProof] = useState(false);
    const [overpaymentProofPreview, setOverpaymentProofPreview] = useState(false);

    const handlePickOverpaymentProof = async () => {
        if (!onUploadOverpaymentProof) return;
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
                const asset = res.assets[0];
                const fileName = asset.fileName || `excess_refund_${Date.now()}.jpg`;
                setIsUploadingOverpaymentProof(true);
                await onUploadOverpaymentProof({
                    uri: asset.uri,
                    name: fileName,
                    mimeType: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize,
                });
                showToast.success('Excess refund proof uploaded successfully.');
            }
        } catch (err) {
            console.error('Image picker error:', err);
            showToast.error('Failed to upload excess refund proof.');
        } finally {
            setIsUploadingOverpaymentProof(false);
        }
    };

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

    const isFullyPaid = verificationStatus === 'fully_paid' || 
        booking.status === 'completed' || 
        (booking.status === 'paid' && remainingBal === 0);
    const isPending = !isFullyPaid && (verificationStatus === 'pending_verification' || manualPayment?.status === 'pending');
    const isDownpayment = !isFullyPaid && (verificationStatus === 'downpayment' || booking.status === 'downpayment' || (remainingBal > 0 && previouslyCaptured > 0));
    const isRejected = !isFullyPaid && (verificationStatus === 'rejected' || manualPayment?.status === 'rejected');

    // Admin payment inputs (Zero Pre-fill Rule & Mandatory Reference)
    const [verifiedAmountInput, setVerifiedAmountInput] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [adminNote, setAdminNote] = useState<string>('');

    // Reset inputs when booking switches or loads
    const [prevBookingId, setPrevBookingId] = useState(booking.id);
    if (booking.id !== prevBookingId) {
        setPrevBookingId(booking.id);
        setVerifiedAmountInput('');
        setReferenceNumber('');
        setAdminNote('');
    }

    const parsedAmount = parseFloat(verifiedAmountInput);
    const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
    const isOverpaid = isValidAmount && parsedAmount > remainingBal;
    const excessAmount = isOverpaid ? parsedAmount - remainingBal : 0;
    const isFullSettlement = isValidAmount && parsedAmount >= remainingBal;
    const remainingAfterVerification = isValidAmount ? Math.max(0, remainingBal - parsedAmount) : remainingBal;

    const handleVerifySubmit = () => {
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            showToast.error('Please enter a valid amount.');
            return;
        }

        if (!referenceNumber.trim()) {
            showToast.error('Reference number is mandatory for verification.');
            return;
        }

        const maxAllowedLimit = Math.max(totalPrice * 10, 100000);
        if (parsedAmount > maxAllowedLimit) {
            showToast.error('Entered amount exceeds maximum allowed limit. Please check for extra zeros.');
            return;
        }

        const combinedNote = [
            adminNote.trim(),
            `Ref: ${referenceNumber.trim()}`
        ].filter(Boolean).join(' | ');

        onVerifyPayment(
            isFullSettlement ? 'full' : 'downpayment',
            combinedNote,
            parsedAmount
        );

        setVerifiedAmountInput('');
        setReferenceNumber('');
        setAdminNote('');
    };

    const renderStatusBadge = () => {
        let statusKey = 'for-payment';
        if (isFullyPaid) statusKey = 'paid';
        else if (isDownpayment) statusKey = 'downpayment';
        else if (isRejected) statusKey = 'reservation-rejected';
        else if (isPending) statusKey = 'verifying-payment';

        return (
            <CustomStatusBadge
                statusKey={statusKey}
                role="admin"
                size="sm"
            />
        );
    };

    return (
        <View style={[styles.card, isMobile && styles.cardMobile]}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerTitleRow}>
                    <CustomIcon library="MaterialCommunityIcons" name="receipt-text-check-outline" size={18} color={Colors.PRIMARY} />
                    <CustomText style={styles.cardTitle}>
                        Review Receipt & Verify
                    </CustomText>
                </View>
                {renderStatusBadge()}
            </View>

            <View style={styles.divider} />

            {/* Overpayment callout if booking has an active overpayment */}
            {booking.overpayment && (
                <View style={styles.overpaymentCallout}>
                    <View style={styles.overpaymentCalloutHeader}>
                        <CustomIcon library="Feather" name="alert-circle" size={16} color="#D97706" />
                        <CustomText style={styles.overpaymentCalloutTitle}>
                            Excess Payment Refund (₱{booking.overpayment.excessAmount.toFixed(2)})
                        </CustomText>
                    </View>
                    <CustomText style={styles.overpaymentCalloutText}>
                        {booking.overpayment.status === 'awaiting_hiker_wallet' && "Hiker has been notified to submit their GCash/Maya wallet details."}
                        {booking.overpayment.status === 'awaiting_admin_payout' && `Hiker submitted wallet details. Please disburse ₱${booking.overpayment.excessAmount.toFixed(2)} and upload receipt proof below.`}
                        {booking.overpayment.status === 'awaiting_user_confirmation' && "Refund payout uploaded. Awaiting hiker receipt confirmation."}
                        {booking.overpayment.status === 'refund_disputed' && `⚠️ Hiker disputed payout (Attempt ${booking.overpayment.disputeCount || 1}/3): "${booking.overpayment.disputeReason || 'No reason provided'}". Please review and upload corrected proof.`}
                        {booking.overpayment.status === 'completed' && "✅ Excess refund successfully received and confirmed by hiker."}
                    </CustomText>

                    {/* Hiker submitted wallet details with Copy button */}
                    {booking.overpayment.userWallet && (
                        <View style={styles.walletDetailsCard}>
                            <View style={styles.walletDetailsRow}>
                                <View style={styles.walletInfo}>
                                    <CustomText style={styles.walletLabel}>
                                        {booking.overpayment.userWallet.walletType.toUpperCase()} WALLET
                                    </CustomText>
                                    <CustomText style={styles.walletNumber} selectable={true}>
                                        {booking.overpayment.userWallet.accountNumber}
                                    </CustomText>
                                    {Boolean(booking.overpayment.userWallet.accountName) && (
                                        <CustomText style={styles.walletName}>
                                            {booking.overpayment.userWallet.accountName}
                                        </CustomText>
                                    )}
                                </View>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={styles.copyBtn}
                                    onPress={async () => {
                                        if (booking.overpayment?.userWallet?.accountNumber) {
                                            await Clipboard.setStringAsync(booking.overpayment.userWallet.accountNumber);
                                            showToast.success('Phone number copied to clipboard.');
                                        }
                                    }}
                                >
                                    <CustomIcon library="Feather" name="copy" size={14} color={Colors.PRIMARY} />
                                    <CustomText style={styles.copyBtnText}>Copy</CustomText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Admin Payout Proof Preview if uploaded */}
                    {booking.overpayment.adminRefundReceiptUrl && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => setOverpaymentProofPreview(true)}
                            style={styles.proofPreviewRow}
                        >
                            <Image
                                source={{ uri: booking.overpayment.adminRefundReceiptUrl }}
                                style={styles.proofThumbnail}
                                resizeMode="cover"
                            />
                            <View style={{ flex: 1 }}>
                                <CustomText style={styles.proofLabel}>Uploaded Payout Proof</CustomText>
                                <CustomText style={styles.proofSubtext}>Tap to inspect receipt screenshot</CustomText>
                            </View>
                            <CustomIcon library="Feather" name="maximize-2" size={16} color={Colors.TEXT_SECONDARY} />
                        </TouchableOpacity>
                    )}

                    {/* Upload button for admin when awaiting payout or disputed */}
                    {(booking.overpayment.status === 'awaiting_admin_payout' || booking.overpayment.status === 'refund_disputed') && onUploadOverpaymentProof && (
                        <CustomButton
                            title={
                                booking.overpayment.status === 'refund_disputed'
                                    ? `Upload Corrected Proof (₱${booking.overpayment.excessAmount.toFixed(2)})`
                                    : `Upload Refund Receipt Proof (₱${booking.overpayment.excessAmount.toFixed(2)})`
                            }
                            variant="primary"
                            icon="upload"
                            iconLibrary="Feather"
                            onPress={handlePickOverpaymentProof}
                            isLoading={isUploadingOverpaymentProof}
                            style={styles.uploadProofBtn}
                        />
                    )}
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

            {/* Receipt Verification Content */}
            {receiptUrl ? (
                <View style={styles.verificationSection}>
                    <View style={[styles.verificationBody, isMobile && styles.verificationBodyMobile]}>
                        {/* Left Column: Receipt Thumbnail & Submitted At */}
                        <View style={[styles.receiptColumn, isMobile && styles.receiptColumnMobile]}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => setPreviewVisible(true)}
                                style={styles.thumbnailWrapper}
                            >
                                <Image source={{ uri: receiptUrl }} style={styles.thumbnail} resizeMode="cover" />
                                <View style={styles.zoomOverlay}>
                                    <CustomIcon library="Feather" name="maximize-2" size={14} color={Colors.WHITE} />
                                    <CustomText style={styles.zoomText}>View Receipt</CustomText>
                                </View>
                            </TouchableOpacity>

                            {(manualPayment?.paidAt || manualPayment?.createdAt || booking.createdAt) && (
                                <View style={styles.submittedAtBox}>
                                    <CustomIcon library="Feather" name="clock" size={12} color={Colors.TEXT_SECONDARY} />
                                    <CustomText style={styles.submittedAtText}>
                                        Submitted At: {formatDateTime(manualPayment?.paidAt || manualPayment?.createdAt || booking.createdAt)}
                                    </CustomText>
                                </View>
                            )}
                        </View>

                        {/* Right Column: Amount, REF Code, Note */}
                        <View style={styles.inputsColumn}>
                            {/* Amount Input */}
                            <CustomTextInput
                                label="Amount (₱) *"
                                placeholder="Enter verified amount..."
                                type="numerical"
                                prefix="₱ "
                                maxLength={10}
                                sanitizeText={sanitizeCurrencyInput}
                                value={verifiedAmountInput}
                                onChangeText={(val: string | Date | null) => setVerifiedAmountInput(sanitizeCurrencyInput(String(val || '')))}
                            />

                            {/* Reference Number Input */}
                            <CustomTextInput
                                label="REF Code *"
                                placeholder="e.g. GCash / Maya Ref Code"
                                value={referenceNumber}
                                maxLength={60}
                                sanitizeText={(text) => stripEmojis(text).replace(/[\x00-\x1F\x7F]/g, '')}
                                onChangeText={(val: string | Date | null) => setReferenceNumber(stripEmojis(String(val || '')).replace(/[\x00-\x1F\x7F]/g, '').slice(0, 60))}
                            />

                            {/* Note Input */}
                            <CustomTextInput
                                label="Note (Optional)"
                                placeholder="e.g. Verified on GCash or notes..."
                                value={adminNote}
                                maxLength={120}
                                sanitizeText={(text) => stripEmojis(text).replace(/[\x00-\x1F\x7F]/g, '')}
                                onChangeText={(val: string | Date | null) => setAdminNote(stripEmojis(String(val || '')).replace(/[\x00-\x1F\x7F]/g, '').slice(0, 120))}
                            />

                            {/* Live calculation feedback banner */}
                            {isValidAmount && (
                                <View style={[
                                    styles.calcFeedbackBox, 
                                    isOverpaid 
                                        ? styles.calcFeedbackOverpaid
                                        : (isFullSettlement ? styles.calcFeedbackFull : styles.calcFeedbackPartial)
                                ]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name={isOverpaid ? "alert-triangle" : (isFullSettlement ? "check-circle" : "info")} 
                                        size={14} 
                                        color={isOverpaid ? '#D97706' : (isFullSettlement ? Colors.SUCCESS : Colors.STATUS_DOWNPAYMENT_TEXT)} 
                                        style={{ marginTop: 2 }}
                                    />
                                    <CustomText style={[
                                        styles.calcFeedbackText, 
                                        { color: isOverpaid ? '#D97706' : (isFullSettlement ? Colors.SUCCESS : Colors.STATUS_DOWNPAYMENT_TEXT) }
                                    ]}>
                                        {isOverpaid 
                                            ? `Overpayment Detected: Hiker sent ₱${parsedAmount.toFixed(2)} for ₱${remainingBal.toFixed(2)} balance. ₱${excessAmount.toFixed(2)} excess refund will be initiated.`
                                            : (isFullSettlement 
                                                ? `Full payment verified. Booking will be marked Completed.` 
                                                : `Downpayment verified. Remaining balance to collect: ₱${remainingAfterVerification.toFixed(2)}`)}
                                    </CustomText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Bottom Action Row: REJECT & VERIFY */}
                    {!isRejecting && (
                        <View style={styles.actionButtonsRow}>
                            <CustomButton
                                title="REJECT"
                                variant="outline"
                                size="md"
                                icon="x"
                                iconLibrary="Feather"
                                onPress={() => setIsRejecting(true)}
                                style={styles.rejectBtn}
                                textStyle={styles.rejectBtnText}
                                disabled={isProcessing}
                            />
                            <CustomButton
                                title="VERIFY"
                                variant="primary"
                                size="md"
                                icon="check-circle"
                                iconLibrary="Feather"
                                onPress={handleVerifySubmit}
                                isLoading={isProcessing}
                                disabled={!isValidAmount || !referenceNumber.trim()}
                                style={styles.verifyBtn}
                            />
                        </View>
                    )}

                    {/* Inline Rejection Reason Form */}
                    {isRejecting && (
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
                                <View style={styles.rejectionBtnWrapper}>
                                    <CustomButton
                                        title="Cancel"
                                        variant="outline"
                                        style={styles.rejectionBtn}
                                        onPress={() => {
                                            setIsRejecting(false);
                                            setRejectionReason('');
                                        }}
                                    />
                                </View>
                                <View style={styles.rejectionBtnWrapper}>
                                    <CustomButton
                                        title="Confirm Rejection"
                                        variant="destructive"
                                        style={styles.rejectionBtn}
                                        onPress={() => onRejectPayment(rejectionReason)}
                                        isLoading={isProcessing}
                                        disabled={!rejectionReason.trim()}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.noReceiptBox}>
                    <CustomIcon library="Feather" name="clock" size={24} color={Colors.STATUS_PENDING_TEXT} />
                    <CustomText style={styles.noReceiptText}>
                        Waiting for hiker to upload a payment receipt screenshot.
                    </CustomText>
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

            {booking.overpayment?.adminRefundReceiptUrl && (
                <ImagePreviewModal
                    visible={overpaymentProofPreview}
                    imageUrl={booking.overpayment.adminRefundReceiptUrl}
                    onClose={() => setOverpaymentProofPreview(false)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 14,
        marginBottom: 16,
    },
    cardMobile: {
        padding: 14,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    cardTitle: {
        fontSize: 14.5,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 0,
        includeFontPadding: false,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    verificationSection: {
        gap: 14,
    },
    verificationBody: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-start',
    },
    verificationBodyMobile: {
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    receiptColumn: {
        width: 155,
        alignItems: 'center',
        gap: 6,
    },
    receiptColumnMobile: {
        width: '100%',
        alignItems: 'center',
    },
    thumbnailWrapper: {
        width: '100%',
        height: 165,
        borderRadius: 12,
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
        backgroundColor: 'rgba(0,0,0,0.65)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        gap: 5,
    },
    zoomText: {
        color: Colors.WHITE,
        fontSize: 10,
        fontWeight: '600',
    },
    submittedAtBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 6,
        width: '100%',
        justifyContent: 'center',
    },
    submittedAtText: {
        fontSize: 10,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 14,
    },
    inputsColumn: {
        flex: 1,
        gap: 8,
        width: '100%',
    },
    calcFeedbackBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        padding: 8,
        borderRadius: 8,
        marginTop: 2,
    },
    calcFeedbackFull: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    calcFeedbackPartial: {
        backgroundColor: Colors.STATUS_DOWNPAYMENT_BG,
    },
    calcFeedbackOverpaid: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FCD34D',
        borderWidth: 1,
    },
    calcFeedbackText: {
        fontSize: 11,
        fontWeight: '600',
        flex: 1,
        lineHeight: 15,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 6,
        alignItems: 'center',
    },
    rejectBtn: {
        flex: 1,
        borderColor: Colors.ERROR,
    },
    rejectBtnText: {
        color: Colors.ERROR,
        fontWeight: '700',
    },
    verifyBtn: {
        flex: 1,
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
    rejectionSection: {
        marginTop: 8,
        gap: 8,
    },
    rejectionButtonsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
        alignItems: 'stretch',
    },
    rejectionBtnWrapper: {
        flex: 1,
        alignSelf: 'stretch',
    },
    rejectionBtn: {
        flex: 1,
        height: '100%',
        minHeight: 48,
        justifyContent: 'center',
    },
    overpaymentCallout: {
        backgroundColor: '#FEF3C7',
        borderColor: '#F59E0B',
        borderWidth: 1,
        padding: 14,
        borderRadius: 12,
        gap: 6,
    },
    overpaymentCalloutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    overpaymentCalloutTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#B45309',
    },
    overpaymentCalloutText: {
        fontSize: 12,
        color: '#92400E',
        lineHeight: 16,
    },
    walletDetailsCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginTop: 6,
    },
    walletDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    walletInfo: {
        flex: 1,
    },
    walletLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#B45309',
        letterSpacing: 0.5,
    },
    walletNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
        marginTop: 2,
    },
    walletName: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 1,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: Colors.PRIMARY_LIGHT || '#E0E7FF',
        borderRadius: 6,
    },
    copyBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
    proofPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginTop: 6,
    },
    proofThumbnail: {
        width: 44,
        height: 44,
        borderRadius: 6,
    },
    proofLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    proofSubtext: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    uploadProofBtn: {
        marginTop: 6,
    },
});

export default ManualQRVerificationCard;
