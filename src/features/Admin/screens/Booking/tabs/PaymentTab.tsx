/**
 * @file PaymentTab.tsx
 * @description Admin component displaying payment and transaction history for a booking.
 * Provides functions to verify downpayment and full payment amounts.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

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
    booking: any;
    currentStatus: string;
    isApprovedStatus: boolean;
    isRejectedStatus: boolean;
    isCancelledStatus: boolean;
    onConfirmPaymentClick: () => void;
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
    onConfirmPaymentClick 
}) => {
    const hasRefundedPayment = booking?.payment?.some((p: any) => p.status === 'refunded');
    const isLockedStatus = ['reservation-rejected', 'cancelled', 'cancellation-rejected', 'refund', 'refunded', 'reschedule-rejected', 'rescheduled', 'expired', 'for-cancellation', 'for-reschedule'].includes(currentStatus);

    const getLockedMessage = () => {
        if (hasRefundedPayment || currentStatus === 'refunded') {
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

    const totalPaid = booking?.payment?.reduce((sum: number, p: any) => p.status === 'captured' ? sum + p.amount : sum, 0) || 0;
    const price = booking?.offer?.price || 0;
    const remainingBalance = price - totalPaid;

    const renderGatewayBadge = (gatewayName: string) => {
        const name = (gatewayName || 'PayMongo').toLowerCase();
        let bgColor = Colors.GRAY_ULTRALIGHT;
        let textColor = Colors.TEXT_SECONDARY;
        let iconName = 'credit-card';
        let displayName = 'PayMongo';

        if (name.includes('gcash')) {
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
                <CustomIcon library="Feather" name={iconName as any} size={12} color={textColor} />
                <CustomText style={[styles.gatewayText, { color: textColor }]}>
                    {displayName}
                </CustomText>
            </View>
        );
    };

    return (
        <View style={styles.tabContent}>
            
            {currentStatus === 'for-payment' && !isLockedStatus && (
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
                            const isPaid = dbStatus === 'paid' || totalPaid >= price;
                            const isDown = dbStatus === 'downpayment' || (totalPaid > 0 && totalPaid < price);

                            if (dbStatus === 'completed') {
                                badgeLabel = "Completed";
                                badgeBg = Colors.STATUS_APPROVED_BG;
                                badgeText = Colors.SUCCESS;
                                badgeIcon = "check-circle";
                            } else if (dbStatus === 'refunded' || hasRefundedPayment) {
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
                                badgeLabel = "Downpayment (50%)";
                                badgeBg = Colors.STATUS_DOWNPAYMENT_BG;
                                badgeText = Colors.STATUS_DOWNPAYMENT_TEXT;
                                badgeIcon = "pie-chart";
                            }

                            return (
                                <View style={[styles.paymentStatusBadge, { backgroundColor: badgeBg }]}>
                                    <CustomIcon library="Feather" name={badgeIcon as any} size={12} color={badgeText} />
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
                            <View style={[styles.progressBarFill, { width: `${Math.min((totalPaid / (price || 1)) * 100, 100)}%` }]} />
                        </View>
                        <View style={styles.progressLabelRow}>
                            <CustomText style={styles.progressText}>
                                {Math.min((totalPaid / (price || 1)) * 100, 100).toFixed(0)}% Collected
                            </CustomText>
                        </View>
                    </View>
                    
                    <View style={styles.breakdownDivider} />
                    
                    <View style={styles.breakdownColumns}>
                        <View style={styles.breakdownCol}>
                            <CustomText style={styles.breakdownColLabel}>
                                {currentStatus === 'downpayment' ? "Paid (50% Downpayment)" : "Paid Amount"}
                            </CustomText>
                            <CustomText style={styles.breakdownColPaid}>₱{totalPaid.toFixed(2)}</CustomText>
                        </View>
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
                    
                    {booking?.payment?.map((paymentRecord: any, idx: number) => {
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
                                
                                {/* Status Row */}
                                <View style={styles.paymentRow}>
                                    <CustomText style={styles.paymentLabel}>Status</CustomText>
                                    <CustomText 
                                        style={[
                                            styles.paymentValue,
                                            { color: statusColor, textTransform: 'uppercase' }
                                        ]}
                                    >
                                        {paymentRecord.status === 'refunded' && paymentRecord.refundedAmount && paymentRecord.amount > 0
                                            ? `${paymentRecord.status} (${Math.round((paymentRecord.refundedAmount / paymentRecord.amount) * 100)}%)`
                                            : paymentRecord.status}
                                    </CustomText>
                                </View>

                                {/* Original Amount Row */}
                                <View style={styles.paymentRow}>
                                    <CustomText style={styles.paymentLabel}>Original Amount</CustomText>
                                    <CustomText 
                                        style={[
                                            styles.paymentValue, 
                                            paymentRecord.status === 'refunded' ? styles.strikethroughAmount : styles.totalValue
                                        ]}
                                    >
                                        ₱{paymentRecord.amount.toFixed(2)}
                                    </CustomText>
                                </View>

                                {/* Refunded Amount Row (if refunded) */}
                                {paymentRecord.status === 'refunded' && paymentRecord.refundedAmount && (
                                    <View style={styles.paymentRow}>
                                        <CustomText style={styles.paymentLabel}>Amount Refunded</CustomText>
                                        <CustomText style={[styles.paymentValue, styles.errorText]}>
                                            ₱{paymentRecord.refundedAmount.toFixed(2)}
                                        </CustomText>
                                    </View>
                                )}

                                {/* Reference Code (stacked row) */}
                                <View style={[styles.paymentRowStacked, styles.noBorder]}>
                                    <CustomText style={styles.paymentLabelStacked}>Reference No.</CustomText>
                                    <CustomText style={styles.paymentValueStacked} selectable={true}>
                                        {paymentRecord.referenceCode || paymentRecord.sessionId || 'N/A'}
                                    </CustomText>
                                </View>
                            </View>
                        );
                    })}

                    {currentStatus !== 'completed' && !isLockedStatus ? (
                        <CustomButton 
                            title="Complete Booking" 
                            variant="primary" 
                            onPress={onConfirmPaymentClick}
                            style={styles.buttonSpacing}
                        />
                    ) : (
                        currentStatus === 'completed' ? (
                            <View style={[styles.lockBanner, styles.lockBannerSuccess]}>
                                <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                                <CustomText style={[styles.lockBannerText, { color: Colors.SUCCESS }]}>
                                    Payment verified. This booking is finalized and completed.
                                </CustomText>
                            </View>
                        ) : (
                            <View style={[styles.lockBanner, styles.lockBannerError]}>
                                <CustomIcon library="Feather" name="lock" size={16} color={Colors.ERROR} />
                                <CustomText style={[styles.lockBannerText, { color: Colors.ERROR }]}>
                                    {lockedMessage}
                                </CustomText>
                            </View>
                        )
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
    }
});

export default PaymentTab;
