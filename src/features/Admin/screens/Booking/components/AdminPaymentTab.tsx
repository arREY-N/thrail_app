import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

export interface AdminPaymentTabProps {
    booking: any;
    currentStatus: string;
    isApprovedStatus: boolean;
    isRejectedStatus: boolean;
    isCancelledStatus: boolean;
    onConfirmPaymentClick: () => void;
}

/**
 * AdminPaymentTab — Displays the payment details for a booking, allowing the admin to verify payments.
 */
const AdminPaymentTab = ({ 
    booking, 
    currentStatus, 
    isApprovedStatus, 
    isRejectedStatus,
    isCancelledStatus,
    onConfirmPaymentClick 
}: AdminPaymentTabProps) => {
    const hasRefundedPayment = booking?.payment?.some((p: any) => p.status === 'refunded');
    
    const lockedMessage = hasRefundedPayment 
        ? "Payment actions are locked because this booking has been explicitly Refunded."
        : "Payment actions are locked because this booking has been Cancelled.";

    return (
        <View style={styles.tabContent}>
            
            {currentStatus === 'for-payment' && !isCancelledStatus && (
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

            {(currentStatus === 'paid' || currentStatus === 'downpayment' || currentStatus === 'completed' || isCancelledStatus) && booking?.payment?.length > 0 && (
                <View style={styles.paymentCard}>
                    
                    {currentStatus === 'completed' && (
                        <View style={styles.successBadge}>
                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.SUCCESS} />
                            <CustomText style={styles.successBadgeText}>
                                Payment Verified & Completed
                            </CustomText>
                        </View>
                    )}
                    
                    {currentStatus === 'downpayment' && (
                        <View style={[styles.warningBadge, styles.downpaymentBg]}>
                            <CustomIcon library="Feather" name="alert-circle" size={16} color={Colors.STATUS_DOWNPAYMENT_TEXT} />
                            <CustomText style={[styles.warningBadgeText, styles.downpaymentText]}>
                                PENDING REMAINING BALANCE (50%)
                            </CustomText>
                        </View>
                    )}

                    {currentStatus === 'paid' && (
                        <View style={[styles.fullPaidBadge, styles.fullyPaidBg]}>
                            <CustomIcon library="Feather" name="check-circle" size={16} color={Colors.STATUS_FULLY_PAID_TEXT} />
                            <CustomText style={[styles.fullPaidBadgeText, styles.fullyPaidText]}>
                                FULLY PAID (100%)
                            </CustomText>
                        </View>
                    )}

                    <CustomText variant="h3" style={styles.summaryTitle}>
                        Transaction Summary
                    </CustomText>
                    
                    {booking?.payment?.map((paymentRecord: any, idx: number) => (
                        <View key={idx} style={styles.paymentRecordBox}>
                            <View style={styles.detailRow}>
                                <CustomText variant="caption" style={styles.detailLabel}>
                                    Gateway
                                </CustomText>
                                <CustomText variant="body" style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                                    {paymentRecord.gateway || 'PayMongo'}
                                </CustomText>
                            </View>
                            
                            <View style={styles.detailRow}>
                                <CustomText variant="caption" style={styles.detailLabel}>
                                    Reference No.
                                </CustomText>
                                <CustomText variant="body" style={styles.detailValue} numberOfLines={1}>
                                    {paymentRecord.referenceCode || paymentRecord.sessionId || 'N/A'}
                                </CustomText>
                            </View>
                            
                            <View style={styles.detailRow}>
                                <CustomText variant="caption" style={styles.detailLabel}>
                                    Status
                                </CustomText>
                                <CustomText 
                                    variant="caption" 
                                    style={[
                                        styles.detailValue,
                                        paymentRecord.status === 'refunded' && styles.errorText,
                                        { textTransform: 'uppercase' }
                                    ]} 
                                >
                                    {paymentRecord.status === 'refunded' && paymentRecord.refundedAmount && paymentRecord.amount > 0
                                        ? `${paymentRecord.status} (${Math.round((paymentRecord.refundedAmount / paymentRecord.amount) * 100)}%)`
                                        : paymentRecord.status}
                                </CustomText>
                            </View>

                            <View style={[styles.detailRow, paymentRecord.status !== 'refunded' && styles.noMarginBottom]}>
                                <CustomText variant="caption" style={styles.detailLabel}>
                                    Original Amount
                                </CustomText>
                                <CustomText 
                                    variant="h3" 
                                    style={[
                                        styles.detailValue, 
                                        paymentRecord.status === 'refunded' ? styles.strikethroughAmount : styles.totalValue
                                    ]}
                                >
                                    ₱{paymentRecord.amount.toFixed(2)}
                                </CustomText>
                            </View>

                            {paymentRecord.status === 'refunded' && (
                                <View style={styles.refundedAmountRow}>
                                    <CustomText variant="caption" style={[styles.detailLabel, styles.errorText]}>
                                        Amount Refunded
                                    </CustomText>
                                    
                                    {paymentRecord.refundedAmount ? (
                                        <CustomText variant="h3" style={[styles.detailValue, styles.errorText]}>
                                            ₱{paymentRecord.refundedAmount.toFixed(2)}
                                        </CustomText>
                                    ) : (
                                        <CustomText variant="body" style={[styles.detailValue, styles.refundedAmountMissing]}>
                                            Not recorded
                                        </CustomText>
                                    )}
                                </View>
                            )}
                        </View>
                    ))}

                    {currentStatus === 'downpayment' && (
                        <CustomText variant="caption" style={styles.downpaymentNote}>
                            * The remaining balance must be collected by the guide on the day of the hike.
                        </CustomText>
                    )}

                    {currentStatus !== 'completed' && !isCancelledStatus && (
                        <CustomButton 
                            title="Complete Booking" 
                            variant="primary" 
                            onPress={onConfirmPaymentClick}
                            style={styles.buttonSpacing}
                        />
                    )}
                </View>
            )}

            {isCancelledStatus && (
                <View style={[
                    styles.emptyPaymentBox, 
                    styles.lockedErrorBox, 
                    booking?.payment?.length > 0 && styles.buttonSpacing
                ]}>
                    <CustomIcon library="Feather" name="lock" size={32} color={Colors.ERROR} style={styles.iconSpacing} />
                    <CustomText style={[styles.emptyPaymentText, styles.errorText]}>
                        {lockedMessage}
                    </CustomText>
                </View>
            )}

            {!isApprovedStatus && !isRejectedStatus && !isCancelledStatus && (
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
        padding: 24, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    emptyPaymentBox: { 
        backgroundColor: '#F9FAFB', 
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
    successBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#E8F5E9', 
        padding: 12, 
        borderRadius: 8, 
        gap: 8, 
        marginBottom: 20 
    },
    successBadgeText: { 
        color: Colors.SUCCESS, 
        fontWeight: 'bold' 
    },
    warningBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 12, 
        borderRadius: 8, 
        gap: 8, 
        marginBottom: 20 
    },
    warningBadgeText: { 
        fontWeight: 'bold' 
    },
    downpaymentBg: { 
        backgroundColor: Colors.STATUS_DOWNPAYMENT_BG 
    },
    downpaymentText: { 
        color: Colors.STATUS_DOWNPAYMENT_TEXT 
    },
    fullPaidBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 12, 
        borderRadius: 8, 
        gap: 8, 
        marginBottom: 20 
    },
    fullPaidBadgeText: { 
        fontWeight: 'bold' 
    },
    fullyPaidBg: { 
        backgroundColor: Colors.STATUS_FULLY_PAID_BG 
    },
    fullyPaidText: { 
        color: Colors.STATUS_FULLY_PAID_TEXT 
    },
    paymentRecordBox: { 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 16, 
        borderRadius: 12, 
        marginBottom: 12 
    },
    summaryTitle: { 
        marginBottom: 16, 
        fontWeight: '700', 
        color: Colors.TEXT_PRIMARY 
    },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    detailLabel: { 
        color: Colors.TEXT_SECONDARY 
    },
    detailValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        flex: 1, 
        textAlign: 'right', 
        marginLeft: 20 
    },
    totalValue: { 
        color: Colors.PRIMARY 
    },
    noMarginBottom: { 
        marginBottom: 0 
    },
    errorText: { 
        color: Colors.ERROR 
    },
    strikethroughAmount: { 
        textDecorationLine: 'line-through', 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 16 
    },
    refundedAmountRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 0, 
        marginTop: 4 
    },
    refundedAmountMissing: { 
        color: Colors.TEXT_SECONDARY, 
        fontStyle: 'italic', 
        fontWeight: '400' 
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
    }
});

export default AdminPaymentTab;
