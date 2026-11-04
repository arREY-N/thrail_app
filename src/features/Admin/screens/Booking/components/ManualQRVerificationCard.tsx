/**
 * @file ManualQRVerificationCard.tsx
 * @description Admin verification card for reviewing hiker manual QR payment receipts,
 * classifying as Full Payment vs Downpayment, and rejecting with reason.
 * Features responsive layout for Web and Mobile, adhering to the updated admin wireframe.
 */

import React, { useState } from 'react';
import {
    Image,
    Keyboard,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
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
import { AdminEditPaymentModal } from '@/src/features/Admin/screens/Booking/components/AdminEditPaymentModal';
import { AdminRevertPaymentModal } from '@/src/features/Admin/screens/Booking/components/AdminRevertPaymentModal';
import { getDisplayReferenceCode } from '@/src/features/Admin/utils/paymentUtils';
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
    onEditPayment?: (options: {
        paymentIndex?: number;
        newAmount: number;
        newReferenceCode: string;
        newClassification: 'full' | 'downpayment';
        newAdminNote?: string;
    }) => Promise<void> | void;
    onRevertPayment?: (options?: {
        paymentIndex?: number;
        revertRejection?: boolean;
        reason?: string;
    }) => Promise<void> | void;
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
    onEditPayment,
    onRevertPayment,
    onUploadOverpaymentProof,
    isProcessing = false,
}) => {
    const { isMobile } = useBreakpoints();
    const { showToast } = useToast();
    const [previewVisible, setPreviewVisible] = useState(false);
    const [hasInspectedReceipt, setHasInspectedReceipt] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    // Edit and Revert modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [isRejectionRevert, setIsRejectionRevert] = useState(false);

    const payments = booking?.payment || [];
    const manualPayment: IPayment<Date> | undefined = [...payments]
        .reverse()
        .find(p => p.gateway === 'manual_qr' || Boolean(p.receiptUrl));

    const manualPaymentIndex = manualPayment ? payments.indexOf(manualPayment) : undefined;
    const isCaptured = manualPayment?.status === 'captured';
    const { refCode: manualRefCode, note: manualNote } = manualPayment ? getDisplayReferenceCode(manualPayment) : { refCode: '', note: undefined };

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
        setHasInspectedReceipt(false);
    }

    const parsedAmount = parseFloat(verifiedAmountInput);
    const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
    const isOverpaid = isValidAmount && parsedAmount > remainingBal;
    const excessAmount = isOverpaid ? parsedAmount - remainingBal : 0;
    const isFullSettlement = isValidAmount && parsedAmount >= remainingBal;
    const remainingAfterVerification = isValidAmount ? Math.max(0, remainingBal - parsedAmount) : remainingBal;

    // Confirmation modal states
    const [showVerifyConfirmModal, setShowVerifyConfirmModal] = useState(false);
    const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [isRejectingReceipt, setIsRejectingReceipt] = useState(false);

    const getBadgeConfig = () => {
        if (isCaptured && manualPayment) {
            return {
                status: manualPayment.classification === 'downpayment' ? 'downpayment' : 'completed',
                label: manualPayment.classification === 'downpayment' ? 'DOWNPAYMENT VERIFIED' : 'FULL PAYMENT VERIFIED',
            };
        }
        if (isRejected) {
            return {
                status: 'reservation-rejected',
                label: 'REJECTED',
            };
        }
        if (isValidAmount) {
            if (isOverpaid) {
                return {
                    status: 'overpaid',
                    label: 'OVERPAID',
                };
            }
            if (isFullSettlement) {
                return {
                    status: 'completed',
                    label: 'FULL PAYMENT',
                };
            }
            return {
                status: 'downpayment',
                label: 'DOWNPAYMENT',
            };
        }
        return {
            status: 'for-reservation',
            label: 'PENDING REVIEW',
        };
    };
    const badgeConfig = getBadgeConfig();

    const handleInputFocus = () => {
        if (!hasInspectedReceipt && receiptUrl) {
            Keyboard.dismiss();
            if (Platform.OS === 'web' && typeof document !== 'undefined') {
                (document.activeElement as HTMLElement | null)?.blur?.();
            }
            setHasInspectedReceipt(true);
            setPreviewVisible(true);
        }
    };

    const handleRejectClick = () => {
        if (!hasInspectedReceipt) {
            setPreviewVisible(true);
            setHasInspectedReceipt(true);
            return;
        }
        setIsRejecting(true);
    };

    const handleVerifyClick = () => {
        if (!hasInspectedReceipt) {
            setPreviewVisible(true);
            setHasInspectedReceipt(true);
            return;
        }

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

        setShowVerifyConfirmModal(true);
    };

    const handleConfirmVerify = async () => {
        setIsVerifyingPayment(true);
        try {
            const combinedNote = [
                adminNote.trim(),
                `Ref: ${referenceNumber.trim()}`
            ].filter(Boolean).join(' | ');

            await onVerifyPayment(
                isFullSettlement ? 'full' : 'downpayment',
                combinedNote,
                parsedAmount
            );

            setShowVerifyConfirmModal(false);
            setVerifiedAmountInput('');
            setReferenceNumber('');
            setAdminNote('');
        } finally {
            setIsVerifyingPayment(false);
        }
    };

    const handleConfirmRejectSubmit = () => {
        if (!rejectionReason.trim()) {
            showToast.error('Please provide a reason for rejection.');
            return;
        }
        setShowRejectConfirmModal(true);
    };

    const handleConfirmReject = async () => {
        setIsRejectingReceipt(true);
        try {
            await onRejectPayment(rejectionReason);
            setShowRejectConfirmModal(false);
            setIsRejecting(false);
            setRejectionReason('');
        } finally {
            setIsRejectingReceipt(false);
        }
    };

    return (
        <View style={[styles.card, isMobile && styles.cardMobile]}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerTitleRow}>
                    <CustomIcon library="MaterialCommunityIcons" name="receipt-text-check-outline" size={18} color={Colors.PRIMARY} />
                    <CustomText style={styles.cardTitle}>
                        {isCaptured ? 'Hike Payment Receipt' : 'Review Receipt & Verify'}
                    </CustomText>
                </View>
                <CustomStatusBadge
                    status={badgeConfig.status}
                    label={badgeConfig.label}
                    size="sm"
                />
            </View>

            <View style={styles.divider} />



            {/* Receipt Verification Content */}
            {receiptUrl ? (
                <View style={styles.verificationSection}>
                    <View style={[styles.verificationBody, isMobile && styles.verificationBodyMobile]}>
                        {/* Left Column: Receipt Thumbnail & Submitted At */}
                        <View style={[styles.receiptColumn, isMobile && styles.receiptColumnMobile]}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    setHasInspectedReceipt(true);
                                    setPreviewVisible(true);
                                }}
                                style={styles.thumbnailWrapper}
                            >
                                <Image source={{ uri: receiptUrl }} style={styles.thumbnail} resizeMode="cover" />
                                <View style={[styles.zoomOverlay, hasInspectedReceipt && styles.zoomOverlayInspected]}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name={hasInspectedReceipt ? "check" : "maximize-2"} 
                                        size={14} 
                                        color={Colors.WHITE} 
                                    />
                                    <CustomText style={styles.zoomText}>
                                        {hasInspectedReceipt ? "Receipt Inspected" : "View Receipt"}
                                    </CustomText>
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

                        {/* Right Column: If captured, show verified details & Edit/Revert. If pending/rejected, show inputs */}
                        {isCaptured && manualPayment ? (
                            <View style={styles.verifiedInfoColumn}>
                                <View style={styles.verifiedDataCard}>
                                    <View style={styles.verifiedDataRow}>
                                        <CustomText style={styles.verifiedDataLabel}>Amount:</CustomText>
                                        <CustomText style={styles.verifiedDataAmount}>
                                            ₱{manualPayment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </CustomText>
                                    </View>
                                    <View style={styles.verifiedDataRow}>
                                        <CustomText style={styles.verifiedDataLabel}>Reference:</CustomText>
                                        <CustomText style={styles.verifiedDataValue} selectable={true}>
                                            {manualRefCode}
                                        </CustomText>
                                    </View>
                                    {Boolean(manualNote) && (
                                        <View style={styles.verifiedDataRowStacked}>
                                            <CustomText style={styles.verifiedDataLabel}>Admin Note:</CustomText>
                                            <CustomText style={styles.verifiedDataNote}>
                                                {manualNote}
                                            </CustomText>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.verifiedActionsRow}>
                                    {onEditPayment && (
                                        <CustomButton
                                            title="Edit Details"
                                            variant="outline"
                                            size="sm"
                                            icon="edit-3"
                                            iconLibrary="Feather"
                                            onPress={() => setShowEditModal(true)}
                                            disabled={isProcessing}
                                            style={styles.verifiedActionBtn}
                                        />
                                    )}
                                    {onRevertPayment && (
                                        <CustomButton
                                            title="Revert"
                                            variant="outline"
                                            size="sm"
                                            icon="rotate-ccw"
                                            iconLibrary="Feather"
                                            iconColor={Colors.WARNING}
                                            textStyle={{ color: Colors.WARNING }}
                                            onPress={() => {
                                                setIsRejectionRevert(false);
                                                setShowRevertModal(true);
                                            }}
                                            disabled={isProcessing}
                                            style={styles.verifiedActionBtn}
                                        />
                                    )}
                                </View>
                            </View>
                        ) : isRejected ? (
                            <View style={styles.rejectedPlaceholderColumn}>
                                <View style={styles.rejectedHeaderGroup}>
                                    <CustomIcon library="Feather" name="alert-triangle" size={18} color={Colors.STATUS_CANCELLED_TEXT} />
                                    <CustomText style={styles.rejectedPlaceholderTitle}>Receipt Verification Rejected</CustomText>
                                </View>
                                <View style={styles.rejectedQuoteBox}>
                                    <CustomText style={styles.rejectedPlaceholderText}>
                                        &quot;{booking.paymentRejectionReason || 'Receipt image is blurry or unreadable'}&quot;
                                    </CustomText>
                                </View>
                                <CustomText style={styles.rejectedPlaceholderHint}>
                                    Revert rejection to re-open verification and review details.
                                </CustomText>
                                {onRevertPayment && (
                                    <CustomButton
                                        title="Revert Rejection"
                                        variant="outline"
                                        size="md"
                                        icon="rotate-ccw"
                                        iconLibrary="Feather"
                                        iconColor={Colors.WARNING}
                                        textStyle={{ color: Colors.WARNING }}
                                        onPress={() => {
                                            setIsRejectionRevert(true);
                                            setShowRevertModal(true);
                                        }}
                                        disabled={isProcessing}
                                        style={styles.revertActionBtn}
                                    />
                                )}
                            </View>
                        ) : (
                            /* Normal Input Column for Pending Review */
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
                                    onFocus={handleInputFocus}
                                    onChangeText={(val: string | Date | null) => setVerifiedAmountInput(sanitizeCurrencyInput(String(val || '')))}
                                />

                                {/* Live calculation feedback banner directly under Amount */}
                                {isValidAmount && (
                                    <View style={styles.calcFeedbackBox}>
                                        <CustomIcon 
                                            library="Feather" 
                                            name={isOverpaid ? "alert-triangle" : (isFullSettlement ? "check-circle" : "info")} 
                                            size={14} 
                                            color={isOverpaid ? Colors.WARNING : (isFullSettlement ? Colors.PRIMARY : Colors.STATUS_DOWNPAYMENT_TEXT)} 
                                            style={{ marginTop: 2 }}
                                        />
                                        <CustomText style={styles.calcFeedbackText}>
                                            <CustomText style={[
                                                styles.calcFeedbackLabel,
                                                { color: isOverpaid ? Colors.WARNING : (isFullSettlement ? Colors.PRIMARY : Colors.STATUS_DOWNPAYMENT_TEXT) }
                                            ]}>
                                                {isOverpaid ? 'Overpayment Detected: ' : (isFullSettlement ? 'Full Payment: ' : 'Downpayment: ')}
                                            </CustomText>
                                            {isOverpaid 
                                                ? `Hiker sent ₱${parsedAmount.toFixed(2)} for ₱${remainingBal.toFixed(2)} balance. ₱${excessAmount.toFixed(2)} excess refund will be initiated.`
                                                : (isFullSettlement 
                                                    ? `Booking will be marked Completed.` 
                                                    : `Remaining balance to collect: ₱${remainingAfterVerification.toFixed(2)}`)}
                                        </CustomText>
                                    </View>
                                )}

                                {/* Reference Number Input */}
                                <CustomTextInput
                                    label="Reference Number *"
                                    placeholder="e.g. 10023482910"
                                    type="numerical"
                                    keyboardType="number-pad"
                                    value={referenceNumber}
                                    maxLength={30}
                                    sanitizeText={(text) => text.replace(/[^0-9]/g, '')}
                                    onFocus={handleInputFocus}
                                    onChangeText={(val: string | Date | null) => setReferenceNumber(String(val || '').replace(/[^0-9]/g, '').slice(0, 30))}
                                />

                                {/* Note Input */}
                                <CustomTextInput
                                    label="Admin Note (Optional)"
                                    placeholder="e.g. Verified in GCash statement or internal remarks..."
                                    value={adminNote}
                                    maxLength={120}
                                    sanitizeText={(text) => stripEmojis(text).replace(/[\x00-\x1F\x7F]/g, '')}
                                    onChangeText={(val: string | Date | null) => setAdminNote(stripEmojis(String(val || '')).replace(/[\x00-\x1F\x7F]/g, '').slice(0, 120))}
                                />
                            </View>
                        )}
                    </View>

                    {/* Bottom Action Row: Reject & Verify Payment (only when not captured, not rejected, and not rejecting) */}
                    {!isCaptured && !isRejecting && !isRejected && (
                        <View style={styles.actionButtonsRow}>
                            <CustomButton
                                title="Reject"
                                variant="outline"
                                size="md"
                                icon="x"
                                iconLibrary="Feather"
                                iconColor={Colors.ERROR}
                                onPress={handleRejectClick}
                                style={[styles.rejectBtn, !hasInspectedReceipt && styles.btnIdle]}
                                textStyle={styles.rejectBtnText}
                                disabled={isProcessing}
                            />
                            <CustomButton
                                title="Verify Payment"
                                variant="primary"
                                size="md"
                                icon="check-circle"
                                iconLibrary="Feather"
                                onPress={handleVerifyClick}
                                isLoading={isProcessing}
                                disabled={!isValidAmount || !referenceNumber.trim() || isProcessing}
                                style={[styles.verifyBtn, !hasInspectedReceipt && styles.btnIdle]}
                            />
                        </View>
                    )}

                    {/* Inline Rejection Reason Form */}
                    {!isCaptured && isRejecting && !isRejected && (
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
                                        onPress={handleConfirmRejectSubmit}
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



            {/* Admin Edit Payment Modal */}
            {manualPayment && onEditPayment && (
                <AdminEditPaymentModal
                    visible={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    payment={manualPayment}
                    paymentIndex={manualPaymentIndex}
                    booking={booking}
                    onConfirm={async (options) => {
                        await onEditPayment(options);
                    }}
                    isSubmitting={isProcessing}
                />
            )}

            {/* Admin Revert Payment Modal */}
            {onRevertPayment && (
                <AdminRevertPaymentModal
                    visible={showRevertModal}
                    onClose={() => {
                        setShowRevertModal(false);
                        setIsRejectionRevert(false);
                    }}
                    payment={manualPayment}
                    paymentIndex={manualPaymentIndex}
                    booking={booking}
                    isRejectionRevert={isRejectionRevert}
                    onConfirm={async (options) => {
                        await onRevertPayment(options);
                    }}
                    isSubmitting={isProcessing}
                />
            )}

            {/* Confirmation Modal for Verifying Payment */}
            <ConfirmationModal
                visible={showVerifyConfirmModal}
                title="Confirm Payment Verification"
                message={`Are you sure you want to verify ₱${parsedAmount.toFixed(2)} as ${isFullSettlement ? 'Full Payment' : 'Downpayment'} for Reference #${referenceNumber.trim()}? The booking will be updated and the hiker notified.`}
                confirmText="Confirm Verification"
                cancelText="Cancel"
                iconName="check-circle"
                iconLibrary="Feather"
                isLoading={isVerifyingPayment}
                onClose={() => setShowVerifyConfirmModal(false)}
                onConfirm={handleConfirmVerify}
            />

            {/* Confirmation Modal for Rejecting Receipt */}
            <ConfirmationModal
                visible={showRejectConfirmModal}
                title="Reject Payment Receipt?"
                message={`Are you sure you want to reject this payment receipt? The hiker will receive your feedback: "${rejectionReason.trim()}".`}
                confirmText="Yes, Reject Receipt"
                cancelText="Cancel"
                isDestructive={true}
                iconName="alert-triangle"
                iconLibrary="Feather"
                isLoading={isRejectingReceipt}
                onClose={() => setShowRejectConfirmModal(false)}
                onConfirm={handleConfirmReject}
            />
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
        color: Colors.TEXT_PRIMARY,
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
    zoomOverlayInspected: {
        backgroundColor: 'rgba(46, 125, 50, 0.85)',
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
        gap: 8,
        padding: 10,
        borderRadius: 8,
        marginTop: 4,
        marginBottom: 4,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    calcFeedbackText: {
        fontSize: 11.5,
        color: Colors.TEXT_SECONDARY,
        flex: 1,
        lineHeight: 16,
    },
    calcFeedbackLabel: {
        fontSize: 11.5,
        fontWeight: '700',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        alignItems: 'stretch',
    },
    rejectBtn: {
        flex: 1,
        minHeight: 52,
        borderColor: Colors.ERROR,
        justifyContent: 'center',
    },
    rejectBtnText: {
        color: Colors.ERROR,
        fontWeight: '700',
    },
    verifyBtn: {
        flex: 1,
        minHeight: 52,
        justifyContent: 'center',
    },
    btnIdle: {
        opacity: 0.72,
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
    rejectedPlaceholderColumn: {
        flex: 1,
        gap: 10,
        padding: 16,
        borderRadius: 12,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        alignItems: 'stretch',
        justifyContent: 'center',
    },
    rejectedHeaderGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    rejectedPlaceholderTitle: {
        fontSize: 13.5,
        fontWeight: '700',
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    rejectedQuoteBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    rejectedPlaceholderText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 16,
    },
    rejectedPlaceholderHint: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    revertActionBtn: {
        marginTop: 6,
        minHeight: 48,
        borderRadius: 10,
        borderColor: Colors.GRAY_LIGHT,
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
        backgroundColor: Colors.STATUS_WARNING_BG,
        borderColor: Colors.STATUS_WARNING_BORDER,
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
        color: Colors.STATUS_WARNING_TEXT,
    },
    overpaymentCalloutText: {
        fontSize: 12,
        color: Colors.STATUS_WARNING_TEXT,
        lineHeight: 16,
    },
    walletDetailsCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: Colors.STATUS_WARNING_BORDER,
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
        color: Colors.STATUS_WARNING_TEXT,
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
        backgroundColor: Colors.PRIMARY_LIGHT,
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
        borderColor: Colors.STATUS_WARNING_BORDER,
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
    revertRejectionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 5,
        paddingHorizontal: 9,
        borderRadius: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: Colors.STATUS_CANCELLED_TEXT,
        alignSelf: 'center',
    },
    revertRejectionBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.STATUS_CANCELLED_TEXT,
    },
    verifiedInfoColumn: {
        flex: 1,
        gap: 10,
        width: '100%',
    },
    verifiedHeaderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        alignSelf: 'flex-start',
    },
    verifiedHeaderPillText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.SUCCESS,
    },
    verifiedDataCard: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 8,
    },
    verifiedDataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    verifiedDataLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    verifiedDataAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    verifiedDataValue: {
        fontSize: 12.5,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    verifiedDataRowStacked: {
        gap: 3,
        marginTop: 2,
    },
    verifiedDataNote: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        fontStyle: 'italic',
        backgroundColor: Colors.WHITE,
        padding: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    verifiedActionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
    },
    verifiedActionBtn: {
        flex: 1,
        minHeight: 48,
    },
});

export default ManualQRVerificationCard;
