/**
 * @file PaymentTab.tsx
 * @description Admin component displaying payment overview, receipt verification,
 * onsite cash settlement, and expandable transaction history for a booking.
 * Responsive for Web and Mobile.
 */

import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { SelectedFile } from '@/src/core/repositories/fileRepository';
import { formatDateTime } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { AdminEditPaymentModal } from '../components/AdminEditPaymentModal';
import { AdminRevertPaymentModal } from '../components/AdminRevertPaymentModal';
import { ManualQRVerificationCard } from '../components/ManualQRVerificationCard';
import { getDisplayReferenceCode } from '@/src/features/Admin/utils/paymentUtils';

export { getDisplayReferenceCode };

/**
 * Props for PaymentTab component.
 */
export interface PaymentTabProps {
    booking: Booking;
    currentStatus: string;
    isApprovedStatus: boolean;
    isRejectedStatus: boolean;
    isCancelledStatus: boolean;
    onConfirmPaymentClick?: () => void;
    onVerifyManualPayment?: (classification: 'full' | 'downpayment', note?: string, verifiedAmount?: number) => Promise<void>;
    onRejectManualPayment?: (reason: string) => Promise<void>;
    onEditManualPayment?: (options: {
        paymentIndex?: number;
        newAmount: number;
        newReferenceCode: string;
        newClassification: 'full' | 'downpayment';
        newAdminNote?: string;
    }) => Promise<void>;
    onRevertManualPayment?: (options?: {
        paymentIndex?: number;
        revertRejection?: boolean;
        reason?: string;
    }) => Promise<void>;
    onSettleRemainingBalance?: (options?: { method?: 'cash' | 'manual_qr'; referenceCode?: string; adminNote?: string }) => Promise<void>;
    onUploadOverpaymentProof?: (file: SelectedFile) => Promise<void | string>;
    isProcessing?: boolean;
}

/**
 * PaymentTab — Cleaned and improved UI for reviewing booking payments.
 */
const PaymentTab: React.FC<PaymentTabProps> = ({ 
    booking, 
    currentStatus, 
    isApprovedStatus, 
    isRejectedStatus,
    isCancelledStatus,
    onVerifyManualPayment,
    onRejectManualPayment,
    onEditManualPayment,
    onRevertManualPayment,
    onSettleRemainingBalance,
    onUploadOverpaymentProof,
    isProcessing = false,
}) => {
    const { isMobile, width } = useBreakpoints();
    const isNarrow = isMobile && width < 380;
    const { showToast } = useToast();

    const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
    const [showPaidCashModal, setShowPaidCashModal] = useState<boolean>(false);
    const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});

    // Edit and Revert modal state
    const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<IPayment<Date> | null>(null);
    const [selectedPaymentIndexForEdit, setSelectedPaymentIndexForEdit] = useState<number | undefined>(undefined);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const [selectedPaymentForRevert, setSelectedPaymentForRevert] = useState<IPayment<Date> | null>(null);
    const [selectedPaymentIndexForRevert, setSelectedPaymentIndexForRevert] = useState<number | undefined>(undefined);
    const [showRevertModal, setShowRevertModal] = useState<boolean>(false);
    const [isRejectionRevert, setIsRejectionRevert] = useState<boolean>(false);

    const toggleAccordion = (idx: number) => {
        setExpandedIndices(prev => ({
            ...prev,
            [idx]: !prev[idx],
        }));
    };

    const hasRefundedPayment = booking?.payment?.some((p: IPayment<Date>) => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));
    const isLockedStatus = ['reservation-rejected', 'cancelled', 'cancellation-rejected', 'refund', 'refunded', 'reschedule-rejected', 'rescheduled', 'expired', 'for-cancellation', 'for-reschedule'].includes(currentStatus);

    const getLockedMessage = () => {
        if (hasRefundedPayment || currentStatus === 'refunded' || currentStatus === 'refund') {
            return "Payment actions are locked because this booking has been explicitly Refunded.";
        }
        switch (currentStatus) {
            case 'expired':
                return "Payment actions are locked because this booking has Expired.";
            case 'rescheduled':
                return "Payment actions are locked because this booking has been Rescheduled.";
            case 'cancelled':
                return "Payment actions are locked because this booking has been Cancelled.";
            case 'reservation-rejected':
                return "Payment actions are locked because the reservation request was rejected.";
            case 'for-cancellation':
                return "Payment actions are locked while cancellation request is pending approval.";
            case 'cancellation-rejected':
                return "Payment actions are locked because the cancellation request was declined.";
            case 'for-reschedule':
                return "Payment actions are locked while reschedule request is pending approval.";
            case 'reschedule-rejected':
                return "Payment actions are locked because the reschedule request was declined.";
            default:
                return "Payment actions are locked.";
        }
    };
    const lockedMessage = getLockedMessage();

    const price = booking?.offer?.price || 0;
    const grossPaid = booking?.payment?.reduce((sum: number, p: IPayment<Date>) => p.status === 'captured' ? sum + p.amount : sum, 0) || 0;
    const totalRefunded = typeof booking?.refundedAmount === 'number' && booking.refundedAmount > 0
        ? booking.refundedAmount
        : (booking?.payment?.reduce((sum: number, p: IPayment<Date>) => sum + (p.refundedAmount || (p.status === 'refunded' ? p.amount : 0)), 0) || 0);
    const netPaid = Math.max(0, grossPaid - totalRefunded);
    const remainingBalance = Math.max(0, price - netPaid);
    const progressPercent = Math.min((netPaid / (price || 1)) * 100, 100);

    const renderGatewayBadge = (gatewayName: string) => {
        const name = (gatewayName || 'PayMongo').toLowerCase();
        let bgColor = Colors.GRAY_ULTRALIGHT;
        let textColor = Colors.TEXT_SECONDARY;
        let iconName = 'credit-card';
        let displayName = gatewayName;
        const isCash = name.includes('cash');

        if (name.includes('manual_qr') || name.includes('manual')) {
            bgColor = Colors.PRIMARY_LIGHT;
            textColor = Colors.PRIMARY;
            iconName = 'check-circle';
            displayName = 'Manual QR';
        } else if (name.includes('gcash')) {
            bgColor = Colors.STATUS_PENDING_BG;
            textColor = Colors.STATUS_PENDING_TEXT;
            iconName = 'smartphone';
            displayName = 'GCash';
        } else if (name.includes('maya') || name.includes('paymaya')) {
            bgColor = Colors.STATUS_APPROVED_BG;
            textColor = Colors.STATUS_APPROVED_TEXT;
            iconName = 'activity';
            displayName = 'Maya';
        } else if (isCash) {
            bgColor = '#D1FAE5';
            textColor = '#065F46';
            iconName = 'check-circle';
            displayName = 'Onsite Cash';
        } else {
            displayName = gatewayName;
        }

        return (
            <View style={[styles.gatewayBadge, { backgroundColor: bgColor }]}>
                {isCash ? (
                    <CustomText style={[styles.badgePesoSign, { color: textColor }]}>₱</CustomText>
                ) : (
                    <CustomIcon library="Feather" name={iconName} size={11} color={textColor} />
                )}
                <CustomText style={[styles.gatewayText, { color: textColor }]}>
                    {displayName}
                </CustomText>
            </View>
        );
    };

    const hasPaymongoCaptured = Boolean(
        booking?.payment?.some((p: IPayment<Date>) => p.gateway === 'paymongo' && p.status === 'captured')
    );
    const hasManualRecord = Boolean(
        booking?.paymentVerificationStatus || 
        booking?.payment?.some((p: IPayment<Date>) => p.gateway === 'manual_qr' || Boolean(p.receiptUrl))
    );
    const hasManualPayment = hasManualRecord || (!hasPaymongoCaptured && PAYMENT_CONFIG.PROVIDER === 'manual_qr');

    const allPayments = (booking?.payment || []).filter((p: IPayment<Date>) => p.status !== 'abandoned');
    const hasPendingPayment = allPayments.some((p: IPayment<Date>) => p.status === 'pending');
    // Receipts history only shows verified/captured or refunded payments
    const verifiedPaymentsList = allPayments.filter((p: IPayment<Date>) => p.status === 'captured' || p.status === 'refunded');

    const showVerificationCard = hasManualPayment && onVerifyManualPayment && (
        hasPendingPayment || 
        booking.paymentVerificationStatus === 'pending_verification' || 
        currentStatus === 'for-payment' || 
        booking.paymentVerificationStatus === 'rejected' ||
        Boolean(booking.overpayment)
    );

    const handleConfirmCashSettlement = async () => {
        if (!onSettleRemainingBalance) return;
        setShowPaidCashModal(false);
        try {
            await onSettleRemainingBalance({
                method: 'cash',
                referenceCode: `CASH-${Date.now()}`,
                adminNote: 'Settled via Onsite Cash',
            });
            showToast.success('Remaining balance settled in cash.');
        } catch {
            showToast.error('Failed to settle balance in cash.');
        }
    };

    return (
        <View style={styles.tabContent}>

            {/* ─── 1. PAYMENT SUMMARY CARD ────────────────────────────── */}
            <View style={[styles.summaryCard, isMobile && styles.summaryCardMobile]}>
                <View style={[styles.summaryHeaderRow, isNarrow && styles.summaryHeaderRowNarrow]}>
                    <View style={styles.summaryTitleGroup}>
                        <CustomIcon library="Feather" name="pie-chart" size={16} color={Colors.PRIMARY} />
                        <CustomText style={styles.summaryCardTitle}>Payment Summary</CustomText>
                    </View>
                    <View style={[styles.paidTotalGroup, isNarrow && styles.paidTotalGroupNarrow]}>
                        <CustomText style={styles.paidTotalValue}>
                            ₱{netPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <CustomText style={styles.paidTotalDenominator}>
                                {' / '}₱{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </CustomText>
                        </CustomText>
                    </View>
                </View>

                {/* Fluid Progress Bar */}
                <View style={styles.progressContainer}>
                    <View 
                        style={[
                            styles.progressBarFill, 
                            { width: `${progressPercent}%` }
                        ]} 
                    />
                </View>

                {/* Balance Row (Right-aligned under progress bar) */}
                <View style={styles.balanceRow}>
                    <View style={styles.balanceInfo}>
                        <CustomText style={styles.balanceLabel}>Balance: </CustomText>
                        <CustomText style={[
                            styles.balanceAmount, 
                            remainingBalance > 0 ? styles.balanceUnpaid : styles.balanceSettled
                        ]}>
                            ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </CustomText>
                    </View>
                </View>
            </View>

            {/* ─── 2. PENDING REVIEW & VERIFICATION CARD ──────────────── */}
            {showVerificationCard && (
                <ManualQRVerificationCard
                    booking={booking}
                    onVerifyPayment={onVerifyManualPayment}
                    onRejectPayment={onRejectManualPayment || (async () => {})}
                    onSettleBalance={onSettleRemainingBalance || (async () => {})}
                    onUploadOverpaymentProof={onUploadOverpaymentProof}
                    onEditPayment={onEditManualPayment}
                    onRevertPayment={onRevertManualPayment}
                    isProcessing={isProcessing}
                />
            )}

            {currentStatus === 'for-payment' && !isLockedStatus && !hasManualPayment && (
                <View style={styles.emptyPaymentBox}>
                    <CustomIcon 
                        library="Feather" 
                        name="clock" 
                        size={32} 
                        color={Colors.STATUS_PENDING_TEXT} 
                        style={styles.iconSpacing} 
                    />
                    <CustomText style={styles.emptyPaymentText}>
                        Waiting for the hiker to complete their payment.
                    </CustomText>
                </View>
            )}

            {/* ─── 3. RECEIPTS CARD (EXPANDABLE ACCORDIONS) ───────────── */}
            <View style={[styles.receiptsCard, isMobile && styles.receiptsCardMobile]}>
                <View style={styles.receiptsCardHeader}>
                    <View style={styles.receiptsTitleGroup}>
                        <CustomIcon library="MaterialCommunityIcons" name="receipt-text-outline" size={18} color={Colors.PRIMARY} />
                        <CustomText style={styles.receiptsCardTitle}>
                            RECEIPTS
                        </CustomText>
                        <View style={styles.receiptsCountBadge}>
                            <CustomText style={styles.receiptsCountText}>
                                {verifiedPaymentsList.length}
                            </CustomText>
                        </View>
                    </View>

                    {/* Paid Cash Button — Clean 'Paid Cash' only, no dollar icon */}
                    {remainingBalance > 0 && !isLockedStatus && onSettleRemainingBalance && (
                        <CustomButton
                            title="Paid Cash"
                            variant="outline"
                            size="sm"
                            autoWidth={true}
                            onPress={() => setShowPaidCashModal(true)}
                            isLoading={isProcessing}
                        />
                    )}
                </View>

                <View style={styles.cardDivider} />

                {/* Accordion Item Cards */}
                {verifiedPaymentsList.length > 0 ? (
                    <View style={styles.receiptsListContainer}>
                        {verifiedPaymentsList.map((paymentRecord: IPayment<Date>, idx: number) => {
                            const isExpanded = Boolean(expandedIndices[idx]);
                            const { refCode, note } = getDisplayReferenceCode(paymentRecord);
                            const isRefunded = paymentRecord.status === 'refunded' || ((paymentRecord.refundedAmount || 0) > 0);
                            const isCashMethod = paymentRecord.method === 'cash' || 
                                (paymentRecord.gateway || '').toLowerCase().includes('cash') || 
                                (paymentRecord.referenceCode || '').startsWith('CASH-');

                            return (
                                <View key={idx} style={styles.accordionCard}>
                                    {/* Collapsed Header (Always Visible, Tappable) */}
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => toggleAccordion(idx)}
                                        style={styles.accordionHeader}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Receipt ${idx + 1}, amount ₱${paymentRecord.amount.toFixed(2)}`}
                                    >
                                        <View style={styles.accordionHeaderLeft}>
                                            {/* Index Badge */}
                                            <View style={styles.indexBadge}>
                                                <CustomText style={styles.indexBadgeText}>
                                                    {idx + 1}
                                                </CustomText>
                                            </View>

                                            {/* Thumbnail preview or Cash Icon */}
                                            {paymentRecord.receiptUrl ? (
                                                <TouchableOpacity
                                                    activeOpacity={0.85}
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        setPreviewReceiptUrl(paymentRecord.receiptUrl!);
                                                    }}
                                                    style={styles.collapsedThumbnailWrapper}
                                                >
                                                    <Image 
                                                        source={{ uri: paymentRecord.receiptUrl }} 
                                                        style={styles.collapsedThumbnail} 
                                                        resizeMode="cover" 
                                                    />
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.collapsedIconBox}>
                                                    {isCashMethod ? (
                                                        <CustomText style={styles.pesoSignIcon}>₱</CustomText>
                                                    ) : (
                                                        <CustomIcon 
                                                            library="Feather" 
                                                            name="credit-card" 
                                                            size={16} 
                                                            color={Colors.PRIMARY} 
                                                        />
                                                    )}
                                                </View>
                                            )}

                                            {/* Amount & Date */}
                                            <View style={styles.collapsedInfo}>
                                                <CustomText style={styles.collapsedAmount}>
                                                    ₱{paymentRecord.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </CustomText>
                                                <CustomText style={styles.collapsedDate}>
                                                    {formatDateTime(paymentRecord.paidAt || paymentRecord.createdAt)}
                                                </CustomText>
                                            </View>
                                        </View>

                                        {/* Right: Dropdown Chevron */}
                                        <View style={styles.accordionHeaderRight}>
                                            <CustomIcon 
                                                library="Feather" 
                                                name={isExpanded ? "chevron-up" : "chevron-down"} 
                                                size={20} 
                                                color={Colors.TEXT_SECONDARY} 
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {/* Expanded Body (Full Details) */}
                                    {isExpanded && (
                                        <View style={styles.accordionBody}>
                                            <View style={styles.accordionDivider} />

                                            {/* Admin-Verified Reference Code Row */}
                                            <View style={styles.detailRow}>
                                                <CustomText style={styles.detailLabel}>Reference Code</CustomText>
                                                <View style={styles.refCodeValueGroup}>
                                                    <CustomText style={styles.refCodeText} selectable={true}>
                                                        {refCode}
                                                    </CustomText>
                                                    {refCode !== 'Onsite Cash' && refCode !== 'Verified by Admin' && (
                                                        <TouchableOpacity
                                                            activeOpacity={0.7}
                                                            style={styles.copyIconButton}
                                                            onPress={async () => {
                                                                await Clipboard.setStringAsync(refCode);
                                                                showToast.success('Reference code copied.');
                                                            }}
                                                        >
                                                            <CustomIcon library="Feather" name="copy" size={13} color={Colors.PRIMARY} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>

                                            {/* Channel / Gateway Row */}
                                            <View style={styles.detailRow}>
                                                <CustomText style={styles.detailLabel}>Channel</CustomText>
                                                {renderGatewayBadge(isCashMethod ? 'cash' : (paymentRecord.method || paymentRecord.gateway))}
                                            </View>

                                            {/* Payment Classification Badge (Downpayment vs Full Payment) */}
                                            {paymentRecord.classification && (
                                                <View style={styles.detailRow}>
                                                    <CustomText style={styles.detailLabel}>Payment Type</CustomText>
                                                    <View style={[
                                                        styles.classificationPill,
                                                        paymentRecord.classification === 'downpayment'
                                                            ? styles.classificationDownpayment
                                                            : styles.classificationFull
                                                    ]}>
                                                        <CustomIcon
                                                            library="Feather"
                                                            name={paymentRecord.classification === 'downpayment' ? 'pie-chart' : 'check-circle'}
                                                            size={11}
                                                            color={paymentRecord.classification === 'downpayment' ? Colors.STATUS_DOWNPAYMENT_TEXT : Colors.SUCCESS}
                                                        />
                                                        <CustomText style={[
                                                            styles.classificationText,
                                                            { color: paymentRecord.classification === 'downpayment' ? Colors.STATUS_DOWNPAYMENT_TEXT : Colors.SUCCESS }
                                                        ]}>
                                                            {paymentRecord.classification === 'downpayment' ? 'DOWNPAYMENT' : 'FULL PAYMENT'}
                                                        </CustomText>
                                                    </View>
                                                </View>
                                            )}

                                            {/* Date & Time Row */}
                                            <View style={styles.detailRow}>
                                                <CustomText style={styles.detailLabel}>Paid At</CustomText>
                                                <CustomText style={styles.detailValue}>
                                                    {formatDateTime(paymentRecord.paidAt || paymentRecord.createdAt)}
                                                </CustomText>
                                            </View>

                                            {/* Optional Admin Note */}
                                            {Boolean(note) && (
                                                <View style={styles.detailRowStacked}>
                                                    <CustomText style={styles.detailLabel}>Admin Note</CustomText>
                                                    <View style={styles.noteBox}>
                                                        <CustomText style={styles.noteText}>
                                                            {note}
                                                        </CustomText>
                                                    </View>
                                                </View>
                                            )}

                                            {/* Receipt Preview Row if uploaded */}
                                            {paymentRecord.receiptUrl && (
                                                <View style={styles.receiptProofCard}>
                                                    <TouchableOpacity
                                                        activeOpacity={0.85}
                                                        onPress={() => setPreviewReceiptUrl(paymentRecord.receiptUrl!)}
                                                        style={styles.receiptProofWrapper}
                                                    >
                                                        <Image
                                                            source={{ uri: paymentRecord.receiptUrl }}
                                                            style={styles.receiptProofThumb}
                                                            resizeMode="cover"
                                                        />
                                                        <View style={{ flex: 1 }}>
                                                            <CustomText style={styles.receiptProofTitle}>
                                                                Payment Receipt Screenshot
                                                            </CustomText>
                                                            <CustomText style={styles.receiptProofSubtext}>
                                                                Tap to inspect full screenshot
                                                            </CustomText>
                                                        </View>
                                                        <CustomIcon library="Feather" name="maximize-2" size={16} color={Colors.PRIMARY} />
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {/* Refund Details (if refunded) */}
                                            {isRefunded && (
                                                <View style={styles.refundCalloutBox}>
                                                    <CustomIcon library="Feather" name="alert-triangle" size={14} color={Colors.ERROR} />
                                                    <View style={{ flex: 1 }}>
                                                        <CustomText style={styles.refundCalloutTitle}>
                                                            Amount Refunded: ₱{(paymentRecord.refundedAmount || paymentRecord.amount).toFixed(2)}
                                                        </CustomText>
                                                        {paymentRecord.refundedAt && (
                                                            <CustomText style={styles.refundCalloutReason}>
                                                                Refunded At: {formatDateTime(paymentRecord.refundedAt)}
                                                            </CustomText>
                                                        )}
                                                        {paymentRecord.refundReason && (
                                                            <CustomText style={styles.refundCalloutReason}>
                                                                Reason: {paymentRecord.refundReason}
                                                            </CustomText>
                                                        )}
                                                    </View>
                                                </View>
                                            )}

                                            {/* Admin Edit or Revert Actions for captured payment */}
                                            {!isRefunded && !isLockedStatus && (
                                                <View style={styles.receiptActionButtonsRow}>
                                                    {onEditManualPayment && (
                                                        <CustomButton
                                                            title="Edit Details"
                                                            variant="outline"
                                                            size="sm"
                                                            icon="edit-3"
                                                            iconLibrary="Feather"
                                                            onPress={() => {
                                                                const actualIndex = (booking.payment || []).indexOf(paymentRecord);
                                                                setSelectedPaymentForEdit(paymentRecord);
                                                                setSelectedPaymentIndexForEdit(actualIndex !== -1 ? actualIndex : idx);
                                                                setShowEditModal(true);
                                                            }}
                                                            disabled={isProcessing}
                                                            style={styles.receiptActionBtn}
                                                        />
                                                    )}
                                                    {onRevertManualPayment && (
                                                        <CustomButton
                                                            title="Revert"
                                                            variant="outline"
                                                            size="sm"
                                                            icon="rotate-ccw"
                                                            iconLibrary="Feather"
                                                            iconColor="#D97706"
                                                            textStyle={{ color: '#D97706' }}
                                                            onPress={() => {
                                                                const actualIndex = (booking.payment || []).indexOf(paymentRecord);
                                                                setSelectedPaymentForRevert(paymentRecord);
                                                                setSelectedPaymentIndexForRevert(actualIndex !== -1 ? actualIndex : idx);
                                                                setIsRejectionRevert(false);
                                                                setShowRevertModal(true);
                                                            }}
                                                            disabled={isProcessing}
                                                            style={styles.receiptActionBtn}
                                                        />
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyReceiptsBox}>
                        <CustomText style={styles.emptyReceiptsText}>
                            No payment receipts recorded yet.
                        </CustomText>
                    </View>
                )}
            </View>

            {/* Lock / Completion Banners */}
            {currentStatus === 'completed' ? (
                <View style={[styles.lockBanner, styles.lockBannerSuccess]}>
                    <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                    <CustomText style={[styles.lockBannerText, { color: Colors.SUCCESS }]}>
                        Payment verified. This booking is finalized and completed.
                    </CustomText>
                </View>
            ) : (
                isLockedStatus ? (
                    <View style={[styles.lockBanner, styles.lockBannerError]}>
                        <CustomIcon library="Feather" name="lock" size={16} color={Colors.ERROR} />
                        <CustomText style={[styles.lockBannerText, { color: Colors.ERROR }]}>
                            {lockedMessage}
                        </CustomText>
                    </View>
                ) : null
            )}

            {/* Fullscreen Image Preview Modal */}
            {previewReceiptUrl && (
                <ImagePreviewModal
                    visible={Boolean(previewReceiptUrl)}
                    imageUrl={previewReceiptUrl}
                    onClose={() => setPreviewReceiptUrl(null)}
                />
            )}

            {/* Cash Settlement Confirmation Modal */}
            <ConfirmationModal
                visible={showPaidCashModal}
                title="Confirm Cash Settlement"
                message={`Confirm that you received ₱${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in cash on-site from the hiker. This will settle the hike in full.`}
                confirmText="Confirm Paid Cash"
                cancelText="Cancel"
                isDestructive={false}
                isLoading={isProcessing}
                iconName="check-circle"
                iconLibrary="Feather"
                onClose={() => setShowPaidCashModal(false)}
                onConfirm={handleConfirmCashSettlement}
            />

            {/* Edit Payment Modal */}
            {selectedPaymentForEdit && onEditManualPayment && (
                <AdminEditPaymentModal
                    visible={showEditModal}
                    booking={booking}
                    payment={selectedPaymentForEdit}
                    paymentIndex={selectedPaymentIndexForEdit}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedPaymentForEdit(null);
                        setSelectedPaymentIndexForEdit(undefined);
                    }}
                    onConfirm={async (options) => {
                        if (options) {
                            await onEditManualPayment(options);
                        }
                        setShowEditModal(false);
                        setSelectedPaymentForEdit(null);
                        setSelectedPaymentIndexForEdit(undefined);
                    }}
                    isProcessing={isProcessing}
                />
            )}

            {/* Revert Payment Verification or Rejection Modal */}
            {onRevertManualPayment && (
                <AdminRevertPaymentModal
                    visible={showRevertModal}
                    booking={booking}
                    payment={selectedPaymentForRevert || undefined}
                    paymentIndex={selectedPaymentIndexForRevert}
                    isRejectionRevert={isRejectionRevert}
                    onClose={() => {
                        setShowRevertModal(false);
                        setSelectedPaymentForRevert(null);
                        setSelectedPaymentIndexForRevert(undefined);
                        setIsRejectionRevert(false);
                    }}
                    onConfirm={async (options) => {
                        await onRevertManualPayment(options);
                        setShowRevertModal(false);
                        setSelectedPaymentForRevert(null);
                        setSelectedPaymentIndexForRevert(undefined);
                        setIsRejectionRevert(false);
                    }}
                    isProcessing={isProcessing}
                />
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: { 
        paddingTop: 4,
        gap: 14,
    },

    /* ── 1. Payment Summary Card ── */
    summaryCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 12,
    },
    summaryCardMobile: {
        padding: 14,
    },
    summaryHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    summaryHeaderRowNarrow: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
    },
    summaryTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    summaryCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 0,
        includeFontPadding: false,
    },
    paidTotalGroup: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    paidTotalGroupNarrow: {
        alignItems: 'flex-start',
    },
    paidTotalValue: {
        fontSize: 13.5,
        fontWeight: '700',
        color: Colors.SUCCESS,
        includeFontPadding: false,
    },
    paidTotalDenominator: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        includeFontPadding: false,
    },
    progressContainer: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 9999,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.SUCCESS,
        borderRadius: 9999,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
    },
    balanceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    balanceLabel: {
        fontSize: 12.5,
        fontWeight: '500',
        color: '#4B5563',
        includeFontPadding: false,
    },
    balanceAmount: {
        fontSize: 13.5,
        fontWeight: '700',
        includeFontPadding: false,
    },
    balanceUnpaid: {
        color: Colors.TEXT_PRIMARY,
    },
    balanceSettled: {
        color: Colors.SUCCESS,
    },

    /* ── 2. Receipts Card ── */
    receiptsCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
        gap: 12,
    },
    receiptsCardMobile: {
        padding: 14,
    },
    receiptsCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    receiptsTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    receiptsCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        letterSpacing: 0.5,
        marginBottom: 0,
        includeFontPadding: false,
    },
    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    emptyReceiptsBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyReceiptsText: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
    },
    receiptsCountBadge: {
        backgroundColor: Colors.PRIMARY_LIGHT,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 10,
    },
    receiptsCountText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
    },
    receiptsListContainer: {
        gap: 10,
    },
    accordionCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
    },
    accordionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    indexBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indexBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    collapsedThumbnailWrapper: {
        width: 38,
        height: 38,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    collapsedThumbnail: {
        width: '100%',
        height: '100%',
    },
    collapsedIconBox: {
        width: 38,
        height: 38,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pesoSignIcon: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.PRIMARY,
        textAlign: 'center',
        includeFontPadding: false,
    },
    collapsedInfo: {
        flex: 1,
        gap: 2,
    },
    collapsedAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    collapsedDate: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    accordionHeaderRight: {
        paddingLeft: 8,
    },

    /* ── Accordion Expanded Body ── */
    accordionBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 10,
    },
    accordionDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailRowStacked: {
        gap: 4,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    refCodeValueGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    refCodeText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    copyIconButton: {
        padding: 4,
        backgroundColor: Colors.PRIMARY_LIGHT,
        borderRadius: 4,
    },
    gatewayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgePesoSign: {
        fontSize: 11,
        fontWeight: 'bold',
        includeFontPadding: false,
        lineHeight: 14,
    },
    gatewayText: {
        fontSize: 11,
        fontWeight: '600',
    },
    classificationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    classificationFull: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    classificationDownpayment: {
        backgroundColor: Colors.STATUS_DOWNPAYMENT_BG,
    },
    classificationText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    noteBox: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 8,
        borderRadius: 6,
    },
    noteText: {
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    receiptProofCard: {
        marginTop: 4,
    },
    receiptProofWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    receiptProofThumb: {
        width: 44,
        height: 44,
        borderRadius: 6,
    },
    receiptProofTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    receiptProofSubtext: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    refundCalloutBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.STATUS_CANCELLED_BG,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.ERROR,
        marginTop: 4,
    },
    refundCalloutTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.ERROR,
    },
    refundCalloutReason: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        marginTop: 2,
    },

    /* ── Empty & Lock Banners ── */
    emptyPaymentBox: { 
        backgroundColor: Colors.INFO_CHIP_BG, 
        padding: 24, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
    emptyPaymentText: { 
        fontSize: 13, 
        color: Colors.TEXT_SECONDARY, 
        textAlign: 'center',
        lineHeight: 18,
    },
    iconSpacing: { 
        marginBottom: 8 
    },
    lockBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 10,
    },
    lockBannerSuccess: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    lockBannerError: {
        backgroundColor: Colors.STATUS_CANCELLED_BG,
    },
    lockBannerText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    receiptActionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    receiptActionBtn: {
        flex: 1,
    },
});

export default PaymentTab;
