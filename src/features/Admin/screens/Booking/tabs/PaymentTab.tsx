/**
 * @file PaymentTab.tsx
 * @description Admin component displaying payment and transaction history for a booking.
 * Provides functions to verify downpayment and full payment amounts.
 */

import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { PAYMENT_CONFIG } from '@/src/core/config/paymentConfig';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { formatDate } from '@/src/core/utility/date';
import { ManualQRVerificationCard } from '../components/ManualQRVerificationCard';

import { SelectedFile } from '@/src/core/repositories/fileRepository';

/**
 * Props for PaymentTab component.
 * @param booking - The booking document being reviewed.
 * @param currentStatus - The derived current workflow status of the booking.
 * @param isApprovedStatus - Flag indicating if the booking is in an approved document state.
 * @param isRejectedStatus - Flag indicating if the booking has been rejected by admin.
 * @param isCancelledStatus - Flag indicating if the booking has been cancelled or expired.
 * @param onConfirmPaymentClick - Callback when admin triggers payment completion verification.
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
    onSettleRemainingBalance?: () => Promise<void>;
    onUploadOverpaymentProof?: (file: SelectedFile) => Promise<void | string>;
    isProcessing?: boolean;
}

/**
 * PaymentTab — Renders payment breakdown totals and payment gateway logs.
 */
const PaymentTab: React.FC<PaymentTabProps> = ({ 
    booking, 
    currentStatus, 
    isApprovedStatus, 
    isRejectedStatus,
    isCancelledStatus,
    onConfirmPaymentClick,
    onVerifyManualPayment,
    onRejectManualPayment,
    onSettleRemainingBalance,
    onUploadOverpaymentProof,
    isProcessing = false,
}) => {
    const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
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

    const renderGatewayBadge = (gatewayName: string) => {
        const name = (gatewayName || 'PayMongo').toLowerCase();
        let bgColor = Colors.GRAY_ULTRALIGHT;
        let textColor = Colors.TEXT_SECONDARY;
        let iconName = 'credit-card';
        let displayName = gatewayName;

        if (name.includes('manual_qr') || name.includes('manual')) {
            bgColor = Colors.PRIMARY_LIGHT;
            textColor = Colors.PRIMARY;
            iconName = 'check-circle';
            displayName = 'Manual QR';
        } else if (name.includes('gcash')) {
            bgColor = Colors.STATUS_PENDING_BG;
            textColor = Colors.STATUS_PENDING_TEXT;
            iconName = 'smartphone';
            displayName = 'PayMongo (GCash)';
        } else if (name.includes('maya') || name.includes('paymaya')) {
            bgColor = Colors.STATUS_APPROVED_BG;
            textColor = Colors.STATUS_APPROVED_TEXT;
            iconName = 'activity';
            displayName = 'PayMongo (Maya)';
        } else if (name === 'paymongo') {
            displayName = 'PayMongo';
        } else {
            displayName = gatewayName;
        }

        return (
            <View style={[styles.gatewayBadge, { backgroundColor: bgColor }]}>
                <CustomIcon library="Feather" name={iconName} size={12} color={textColor} />
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

    return (
        <View style={styles.tabContent}>

            {/* Manual QR Verification Card for Admin */}
            {hasManualPayment && onVerifyManualPayment && (
                <ManualQRVerificationCard
                    booking={booking}
                    onVerifyPayment={onVerifyManualPayment}
                    onRejectPayment={onRejectManualPayment || (async () => {})}
                    onSettleBalance={onSettleRemainingBalance || (async () => {})}
                    onUploadOverpaymentProof={onUploadOverpaymentProof}
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

            {(currentStatus === 'paid' || currentStatus === 'downpayment' || currentStatus === 'completed' || isLockedStatus) && booking?.payment?.length > 0 && (
                <View style={styles.paymentCard}>
                    
                    {/* Payment Summary Header & Integrated Status Badge */}
                    <View style={styles.breakdownHeaderRow}>
                        <CustomText style={styles.breakdownTitle}>Payment Summary</CustomText>
                        {(() => {
                            let badgeLabel = "Unpaid";
                            let badgeBg = Colors.GRAY_ULTRALIGHT;
                            let badgeText = Colors.TEXT_SECONDARY;
                            let badgeIcon = "clock";

                            const dbStatus = booking?.status;
                            const isPaid = dbStatus === 'paid' || netPaid >= price;
                            const isDown = dbStatus === 'downpayment' || (netPaid > 0 && netPaid < price);

                            if (dbStatus === 'completed') {
                                badgeLabel = "Completed";
                                badgeBg = Colors.STATUS_APPROVED_BG;
                                badgeText = Colors.SUCCESS;
                                badgeIcon = "check-circle";
                            } else if (dbStatus === 'refunded' || dbStatus === 'refund' || hasRefundedPayment) {
                                badgeLabel = "Refunded";
                                badgeBg = Colors.STATUS_CANCELLED_BG;
                                badgeText = Colors.STATUS_CANCELLED_TEXT;
                                badgeIcon = "refresh-ccw";
                            } else if (isPaid) {
                                badgeLabel = "Fully Paid";
                                badgeBg = Colors.STATUS_FULLY_PAID_BG;
                                badgeText = Colors.STATUS_FULLY_PAID_TEXT;
                                badgeIcon = "check-circle";
                            } else if (isDown) {
                                badgeLabel = "Downpayment";
                                badgeBg = Colors.STATUS_DOWNPAYMENT_BG;
                                badgeText = Colors.STATUS_DOWNPAYMENT_TEXT;
                                badgeIcon = "pie-chart";
                            }

                            return (
                                <View style={[styles.paymentStatusBadge, { backgroundColor: badgeBg }]}>
                                    <CustomIcon library="Feather" name={badgeIcon} size={12} color={badgeText} />
                                    <CustomText style={[styles.paymentStatusBadgeText, { color: badgeText }]}>
                                        {badgeLabel.toUpperCase()}
                                    </CustomText>
                                </View>
                            );
                        })()}
                    </View>
                    
                    <View style={styles.breakdownDivider} />

                    {/* Modern Price Breakdown Hero Panel with Progress Bar */}
                    <View style={styles.priceHeroPanel}>
                        <View style={styles.priceHeroHeader}>
                            <CustomText style={styles.priceHeroLabel}>Total Hike Price</CustomText>
                            <CustomText style={styles.priceHeroAmount}>₱{price.toFixed(2)}</CustomText>
                        </View>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBarFill, { width: `${Math.min((netPaid / (price || 1)) * 100, 100)}%` }]} />
                        </View>
                        <View style={styles.progressLabelRow}>
                            <CustomText style={styles.progressText}>
                                {Math.min((netPaid / (price || 1)) * 100, 100).toFixed(0)}% Net Collected
                            </CustomText>
                        </View>
                    </View>
                    
                    <View style={styles.breakdownDivider} />
                    
                    <View style={styles.breakdownColumns}>
                        <View style={styles.breakdownCol}>
                            <CustomText style={styles.breakdownColLabel}>
                                {totalRefunded > 0 ? "Gross Collected" : (currentStatus === 'downpayment' ? "Downpayment Paid" : "Paid Amount")}
                            </CustomText>
                            <CustomText style={styles.breakdownColPaid}>₱{grossPaid.toFixed(2)}</CustomText>
                        </View>
                        {totalRefunded > 0 && (
                            <>
                                <View style={styles.breakdownCol}>
                                    <CustomText style={[styles.breakdownColLabel, { color: Colors.ERROR }]}>
                                        Amount Refunded
                                    </CustomText>
                                    <CustomText style={[styles.breakdownColPaid, { color: Colors.ERROR }]}>
                                        -₱{totalRefunded.toFixed(2)}
                                    </CustomText>
                                </View>
                                <View style={styles.breakdownCol}>
                                    <CustomText style={[styles.breakdownColLabel, { color: Colors.PRIMARY }]}>
                                        Net Collected
                                    </CustomText>
                                    <CustomText style={[styles.breakdownColPaid, { color: Colors.PRIMARY }]}>
                                        ₱{netPaid.toFixed(2)}
                                    </CustomText>
                                </View>
                            </>
                        )}
                        <View style={styles.breakdownCol}>
                            <CustomText style={styles.breakdownColLabel}>To Collect (Remaining)</CustomText>
                            <CustomText style={[
                                styles.breakdownColBalance,
                                remainingBalance <= 0 && { color: Colors.SUCCESS }
                            ]}>
                                ₱{remainingBalance.toFixed(2)}
                            </CustomText>
                        </View>
                    </View>

                    <CustomText variant="h3" style={styles.summaryTitle}>
                        Transaction Summary
                    </CustomText>
                    
                    {booking?.payment?.filter((p: IPayment<Date>) => p.status !== 'abandoned').map((paymentRecord: IPayment<Date>, idx: number) => {
                        const statusColor = paymentRecord.status === 'captured' 
                            ? Colors.SUCCESS 
                            : (paymentRecord.status === 'refunded' ? Colors.ERROR : Colors.STATUS_PENDING_TEXT);
                        
                        return (
                            <View key={idx} style={styles.paymentRecordBox}>
                                {/* Gateway Row */}
                                <View style={styles.paymentRow}>
                                    <CustomText style={styles.paymentLabel}>Gateway</CustomText>
                                    <View style={styles.paymentValueContainer}>
                                        {renderGatewayBadge(paymentRecord.gateway)}
                                    </View>
                                </View>

                                {/* Method / Channel Row */}
                                {paymentRecord.method && (
                                    <View style={styles.paymentRow}>
                                        <CustomText style={styles.paymentLabel}>Channel</CustomText>
                                        <CustomText style={[styles.paymentValue, { textTransform: 'capitalize' }]}>
                                            {paymentRecord.method === 'maya' || paymentRecord.method === 'paymaya' 
                                                ? 'Maya' 
                                                : paymentRecord.method === 'gcash' 
                                                    ? 'GCash' 
                                                    : paymentRecord.method}
                                        </CustomText>
                                    </View>
                                )}
                                                          {/* Status Row */}
                                <View style={styles.paymentRow}>
                                    <CustomText style={styles.paymentLabel}>Status</CustomText>
                                    <CustomText 
                                        style={[
                                            styles.paymentValue,
                                            { color: statusColor, textTransform: 'uppercase' }
                                        ]}
                                    >
                                        {paymentRecord.status === 'refunded'
                                            ? `REFUNDED${paymentRecord.refundedAmount && paymentRecord.amount > 0 ? ` (${Math.round((paymentRecord.refundedAmount / paymentRecord.amount) * 100)}%)` : ''}`
                                            : (paymentRecord.refundedAmount && paymentRecord.refundedAmount > 0
                                                ? `PARTIALLY REFUNDED (${Math.round((paymentRecord.refundedAmount / paymentRecord.amount) * 100)}%)`
                                                : paymentRecord.status)
                                        }
                                    </CustomText>
                                </View>

                                {/* Payment Classification Row (Downpayment vs Full Payment) */}
                                {paymentRecord.classification && (
                                    <View style={styles.paymentRow}>
                                        <CustomText style={styles.paymentLabel}>Payment Type</CustomText>
                                        <View style={[
                                            styles.classificationBadge,
                                            paymentRecord.classification === 'downpayment'
                                                ? styles.classificationBadgeDownpayment
                                                : styles.classificationBadgeFull
                                        ]}>
                                            <CustomIcon
                                                library="Feather"
                                                name={paymentRecord.classification === 'downpayment' ? 'pie-chart' : 'check-circle'}
                                                size={11}
                                                color={paymentRecord.classification === 'downpayment' ? Colors.STATUS_DOWNPAYMENT_TEXT : Colors.SUCCESS}
                                            />
                                            <CustomText style={[
                                                styles.classificationBadgeText,
                                                { color: paymentRecord.classification === 'downpayment' ? Colors.STATUS_DOWNPAYMENT_TEXT : Colors.SUCCESS }
                                            ]}>
                                                {paymentRecord.classification === 'downpayment' ? 'DOWNPAYMENT' : 'FULL PAYMENT'}
                                            </CustomText>
                                        </View>
                                    </View>
                                )}

                                {/* Original Amount Row */}
                                <View style={styles.paymentRow}>
                                    <CustomText style={styles.paymentLabel}>Original Amount</CustomText>
                                    <CustomText 
                                        style={[
                                            styles.paymentValue, 
                                            (paymentRecord.status === 'refunded' || (paymentRecord.refundedAmount && paymentRecord.refundedAmount > 0)) ? styles.strikethroughAmount : styles.totalValue
                                        ]}
                                    >
                                        ₱{paymentRecord.amount.toFixed(2)}
                                    </CustomText>
                                </View>

                                {/* Refunded Amount Row (if refunded) */}
                                {(paymentRecord.status === 'refunded' || (paymentRecord.refundedAmount && paymentRecord.refundedAmount > 0)) && (
                                    <View style={styles.paymentRow}>
                                        <CustomText style={styles.paymentLabel}>Amount Refunded</CustomText>
                                        <CustomText style={[styles.paymentValue, styles.errorText]}>
                                            ₱{(paymentRecord.refundedAmount || paymentRecord.amount).toFixed(2)}
                                        </CustomText>
                                    </View>
                                )}

                                {/* Refund Reason (if refunded) */}
                                {(paymentRecord.status === 'refunded' || (paymentRecord.refundedAmount && paymentRecord.refundedAmount > 0)) && paymentRecord.refundReason && (
                                    <View style={styles.paymentRow}>
                                        <CustomText style={styles.paymentLabel}>Refund Reason</CustomText>
                                        <CustomText style={[styles.paymentValue, { textTransform: 'capitalize' }]}>
                                            {paymentRecord.refundReason}
                                        </CustomText>
                                    </View>
                                )}

                                {/* Reference Code (stacked row - prioritizes pay_ ID) */}
                                <View style={[styles.paymentRowStacked, (!paymentRecord.receiptUrl && !paymentRecord.refundProofUrl) && styles.noBorder]}>
                                    <CustomText style={styles.paymentLabelStacked}>Reference No.</CustomText>
                                    <CustomText style={styles.paymentValueStacked} selectable={true}>
                                        {paymentRecord.gatewayId || paymentRecord.referenceCode || paymentRecord.sessionId || 'N/A'}
                                    </CustomText>
                                </View>

                                {/* User Payment Receipt Screenshot (Documented for Audit) */}
                                {paymentRecord.receiptUrl && (
                                    <View style={styles.receiptProofSection}>
                                        <View style={styles.receiptProofHeader}>
                                            <View style={styles.receiptProofHeaderTitle}>
                                                <CustomIcon library="MaterialCommunityIcons" name="receipt-text-outline" size={15} color={Colors.PRIMARY} />
                                                <CustomText style={styles.receiptProofTitle}>
                                                    Payment Receipt
                                                </CustomText>
                                            </View>
                                            {(paymentRecord.paidAt || paymentRecord.createdAt) && (
                                                <CustomText style={styles.receiptProofDate}>
                                                    {formatDate(paymentRecord.paidAt || paymentRecord.createdAt)}
                                                </CustomText>
                                            )}
                                        </View>

                                        <View style={styles.receiptProofContent}>
                                            <TouchableOpacity
                                                activeOpacity={0.85}
                                                onPress={() => setPreviewReceiptUrl(paymentRecord.receiptUrl!)}
                                                style={styles.receiptThumbnailWrapper}
                                                accessibilityRole="button"
                                                accessibilityLabel="View payment receipt in full screen"
                                            >
                                                <Image 
                                                    source={{ uri: paymentRecord.receiptUrl }} 
                                                    style={styles.receiptThumbnail} 
                                                    resizeMode="cover" 
                                                />
                                                <View style={styles.receiptZoomOverlay}>
                                                    <CustomIcon library="Feather" name="maximize-2" size={11} color={Colors.WHITE} />
                                                    <CustomText style={styles.receiptZoomText}>View</CustomText>
                                                </View>
                                            </TouchableOpacity>

                                            <View style={styles.receiptProofMeta}>
                                                <CustomText style={styles.receiptTapHint}>
                                                    User submitted payment receipt screenshot. Tap to view full size.
                                                </CustomText>

                                                {paymentRecord.adminNote ? (
                                                    <View style={styles.receiptAdminNoteBox}>
                                                        <CustomText style={styles.receiptAdminNoteLabel}>Admin Note:</CustomText>
                                                        <CustomText style={styles.receiptAdminNoteText}>
                                                            {paymentRecord.adminNote}
                                                        </CustomText>
                                                    </View>
                                                ) : null}

                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={() => setPreviewReceiptUrl(paymentRecord.receiptUrl!)}
                                                    style={styles.enlargeButton}
                                                >
                                                    <CustomIcon library="Feather" name="zoom-in" size={13} color={Colors.PRIMARY} />
                                                    <CustomText style={styles.enlargeButtonText}>
                                                        Enlarge Receipt
                                                    </CustomText>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Refund Payout Proof (if available) */}
                                {paymentRecord.refundProofUrl && (
                                    <View style={[styles.receiptProofSection, styles.refundProofSection]}>
                                        <View style={styles.receiptProofHeader}>
                                            <View style={styles.receiptProofHeaderTitle}>
                                                <CustomIcon library="Feather" name="arrow-up-right" size={15} color={Colors.ERROR} />
                                                <CustomText style={[styles.receiptProofTitle, { color: Colors.ERROR }]}>
                                                    Refund Payout Proof
                                                </CustomText>
                                            </View>
                                            {paymentRecord.refundedAt && (
                                                <CustomText style={styles.receiptProofDate}>
                                                    {formatDate(paymentRecord.refundedAt)}
                                                </CustomText>
                                            )}
                                        </View>

                                        <View style={styles.receiptProofContent}>
                                            <TouchableOpacity
                                                activeOpacity={0.85}
                                                onPress={() => setPreviewReceiptUrl(paymentRecord.refundProofUrl!)}
                                                style={styles.receiptThumbnailWrapper}
                                                accessibilityRole="button"
                                                accessibilityLabel="View refund payout proof in full screen"
                                            >
                                                <Image 
                                                    source={{ uri: paymentRecord.refundProofUrl }} 
                                                    style={styles.receiptThumbnail} 
                                                    resizeMode="cover" 
                                                />
                                                <View style={styles.receiptZoomOverlay}>
                                                    <CustomIcon library="Feather" name="maximize-2" size={11} color={Colors.WHITE} />
                                                    <CustomText style={styles.receiptZoomText}>View</CustomText>
                                                </View>
                                            </TouchableOpacity>

                                            <View style={styles.receiptProofMeta}>
                                                <CustomText style={styles.receiptTapHint}>
                                                    Proof of refund transfer to hiker. Tap to view full size.
                                                </CustomText>

                                                <TouchableOpacity
                                                    activeOpacity={0.8}
                                                    onPress={() => setPreviewReceiptUrl(paymentRecord.refundProofUrl!)}
                                                    style={styles.enlargeButton}
                                                >
                                                    <CustomIcon library="Feather" name="zoom-in" size={13} color={Colors.ERROR} />
                                                    <CustomText style={[styles.enlargeButtonText, { color: Colors.ERROR }]}>
                                                        Enlarge Proof
                                                    </CustomText>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}

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

                    {/* Refund & Settlement Rules Card */}
                    {PAYMENT_CONFIG.PROVIDER === 'manual_qr' ? (
                        <View style={styles.refundPolicyCard}>
                            <View style={styles.refundPolicyHeader}>
                                <CustomIcon library="Feather" name="info" size={16} color={Colors.PRIMARY} />
                                <CustomText style={styles.refundPolicyTitle}>
                                    Manual Refund & Cancellation Policy
                                </CustomText>
                            </View>
                            <View style={styles.refundPolicyContent}>
                                <View style={styles.refundPolicyRow}>
                                    <CustomIcon library="Feather" name="check-circle" size={13} color={Colors.SUCCESS} style={styles.policyIcon} />
                                    <CustomText style={styles.refundPolicyText}>
                                        <CustomText style={styles.policyHighlight}>Direct E-Wallet Refund: </CustomText>
                                        Refunds are sent directly to the hiker&apos;s GCash or Maya wallet.
                                    </CustomText>
                                </View>
                                <View style={styles.refundPolicyRow}>
                                    <CustomIcon library="Feather" name="clock" size={13} color="#D97706" style={styles.policyIcon} />
                                    <CustomText style={styles.refundPolicyText}>
                                        <CustomText style={styles.policyHighlight}>Same-Day Processing: </CustomText>
                                        Any refund amount (full, partial, or custom) can be issued immediately today without overnight settlement delays.
                                    </CustomText>
                                </View>
                                <View style={styles.refundPolicyRow}>
                                    <CustomIcon library="Feather" name="shield" size={13} color={Colors.TEXT_SECONDARY} style={styles.policyIcon} />
                                    <CustomText style={styles.refundPolicyText}>
                                        <CustomText style={styles.policyHighlight}>Proof of Transfer: </CustomText>
                                        After approval, the hiker provides their wallet details and the organizer uploads a payout transfer receipt.
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.refundPolicyCard}>
                            <View style={styles.refundPolicyHeader}>
                                <CustomIcon library="Feather" name="info" size={16} color={Colors.PRIMARY} />
                                <CustomText style={styles.refundPolicyTitle}>
                                    PayMongo Refund & Settlement Rules
                                </CustomText>
                            </View>
                            <View style={styles.refundPolicyContent}>
                                <View style={styles.refundPolicyRow}>
                                    <CustomIcon library="Feather" name="check-circle" size={13} color={Colors.SUCCESS} style={styles.policyIcon} />
                                    <CustomText style={styles.refundPolicyText}>
                                        <CustomText style={styles.policyHighlight}>Full Refund (100%): </CustomText>
                                        Can be processed immediately at any time, including on the same calendar day.
                                    </CustomText>
                                </View>
                                <View style={styles.refundPolicyRow}>
                                    <CustomIcon library="Feather" name="clock" size={13} color="#D97706" style={styles.policyIcon} />
                                    <CustomText style={styles.refundPolicyText}>
                                        <CustomText style={styles.policyHighlight}>Partial Refunds: </CustomText>
                                        PayMongo requires overnight daily settlement. Partial refunds become available on the next calendar day.
                                    </CustomText>
                                </View>
                                <View style={styles.refundPolicyRow}>
                                    <CustomIcon library="Feather" name="shield" size={13} color={Colors.TEXT_SECONDARY} style={styles.policyIcon} />
                                    <CustomText style={styles.refundPolicyText}>
                                        <CustomText style={styles.policyHighlight}>Custom Amounts: </CustomText>
                                        Admins can refund exact sums (₱1.00 minimum up to total paid) under the same settlement rules.
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {isLockedStatus && (!booking?.payment || booking.payment.length === 0) && (
                <View style={[styles.emptyPaymentBox, styles.lockedErrorBox]}>
                    <CustomIcon library="Feather" name="lock" size={32} color={Colors.ERROR} style={styles.iconSpacing} />
                    <CustomText style={[styles.emptyPaymentText, styles.errorText]}>
                        {lockedMessage}
                    </CustomText>
                </View>
            )}

            {!isApprovedStatus && !isRejectedStatus && !isLockedStatus && currentStatus === 'for-reservation' && (
                <View style={styles.emptyPaymentBox}>
                    <CustomIcon library="Feather" name="lock" size={32} color={Colors.GRAY_MEDIUM} style={styles.iconSpacing} />
                    <CustomText style={styles.emptyPaymentText}>
                        You must approve all documents before accessing the payment verification phase.
                    </CustomText>
                </View>
            )}

            {/* Fullscreen Image Preview Modal */}
            {previewReceiptUrl && (
                <ImagePreviewModal
                    visible={Boolean(previewReceiptUrl)}
                    imageUrl={previewReceiptUrl}
                    onClose={() => setPreviewReceiptUrl(null)}
                />
            )}
            
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: { 
        paddingTop: 4 
    },
    paymentCard: { 
        backgroundColor: Colors.WHITE, 
        padding: 20, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    emptyPaymentBox: { 
        backgroundColor: Colors.INFO_CHIP_BG, 
        padding: 32, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed', 
        alignItems: 'center' 
    },
    emptyPaymentText: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY 
    },
    paymentRecordBox: { 
        backgroundColor: Colors.BACKGROUND, 
        paddingHorizontal: 16,
        paddingVertical: 12, 
        borderRadius: 16, 
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 12 
    },
    summaryTitle: { 
        marginTop: 20,
        marginBottom: 16, 
        fontWeight: '700', 
        color: Colors.TEXT_PRIMARY 
    },
    totalValue: { 
        color: Colors.PRIMARY 
    },
    errorText: { 
        color: Colors.ERROR 
    },
    strikethroughAmount: { 
        textDecorationLine: 'line-through', 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 14 
    },
    lockedErrorBox: { 
        borderColor: Colors.ERROR_BORDER, 
        backgroundColor: Colors.ERROR_BG 
    },
    downpaymentNote: { 
        color: Colors.TEXT_SECONDARY, 
        fontStyle: 'italic', 
        marginTop: 8, 
        marginBottom: 16, 
        textAlign: 'center' 
    },
    buttonSpacing: { 
        marginTop: 16 
    },
    iconSpacing: { 
        marginBottom: 12 
    },
    
    // Gateway Badges
    gatewayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    gatewayText: {
        fontSize: 11,
        fontWeight: 'bold'
    },

    // Breakdown Card Header
    breakdownHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    breakdownTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY
    },
    paymentStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    paymentStatusBadgeText: {
        fontSize: 10,
        fontWeight: 'bold'
    },

    // Row-based totals
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    breakdownLabel: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500'
    },
    breakdownTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 10
    },
    breakdownColumns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 8
    },
    breakdownCol: {
        flex: 1
    },
    breakdownColLabel: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 4
    },
    breakdownColPaid: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.SUCCESS
    },
    breakdownColBalance: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.STATUS_DOWNPAYMENT_TEXT
    },
    
    // Price breakdown hero panel
    priceHeroPanel: {
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.GRAY_LIGHT,
    },
    priceHeroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priceHeroLabel: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    priceHeroAmount: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
    },
    progressContainer: {
        height: 6,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.SUCCESS,
        borderRadius: 3,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    progressText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
    },

    // Row-based transaction details (borderless inline spacing)
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        flexWrap: 'wrap',
    },
    paymentLabel: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '500',
        flexShrink: 1,
        marginRight: 16,
    },
    paymentValue: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
        textAlign: 'right',
    },
    paymentValueContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        flex: 1,
    },
    paymentRowStacked: {
        flexDirection: 'column',
        paddingVertical: 10,
        gap: 4,
    },
    paymentLabelStacked: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    paymentValueStacked: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 12,
        fontWeight: '700',
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    lockBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 16,
    },
    lockBannerSuccess: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.SUCCESS,
    },
    lockBannerError: {
        backgroundColor: Colors.ERROR_BG,
        borderColor: Colors.ERROR_BORDER,
    },
    lockBannerText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    refundPolicyCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    refundPolicyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    refundPolicyTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    refundPolicyContent: {
        gap: 8,
    },
    refundPolicyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    policyIcon: {
        marginTop: 2,
    },
    refundPolicyText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        color: Colors.TEXT_SECONDARY,
    },
    policyHighlight: {
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },

    // Classification Badge
    classificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    classificationBadgeDownpayment: {
        backgroundColor: Colors.STATUS_DOWNPAYMENT_BG,
    },
    classificationBadgeFull: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    classificationBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },

    // Receipt Proof Section inside Transaction Box
    receiptProofSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    refundProofSection: {
        borderTopColor: Colors.ERROR_BORDER,
    },
    receiptProofHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    receiptProofHeaderTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    receiptProofTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    receiptProofDate: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    receiptProofContent: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    receiptThumbnailWrapper: {
        width: 84,
        height: 110,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        position: 'relative',
    },
    receiptThumbnail: {
        width: '100%',
        height: '100%',
    },
    receiptZoomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 3,
        gap: 3,
    },
    receiptZoomText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.WHITE,
    },
    receiptProofMeta: {
        flex: 1,
        justifyContent: 'space-between',
        gap: 6,
    },
    receiptTapHint: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 15,
    },
    receiptAdminNoteBox: {
        backgroundColor: Colors.WHITE,
        borderRadius: 6,
        padding: 6,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    receiptAdminNoteLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
    },
    receiptAdminNoteText: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        marginTop: 2,
    },
    enlargeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    enlargeButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
});

export default PaymentTab;
