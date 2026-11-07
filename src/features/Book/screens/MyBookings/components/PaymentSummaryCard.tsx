import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IOverpaymentDetails, IPayment } from '@/src/core/models/Booking/Booking';
import { safeParseDateString } from '@/src/utils/dateFormatter';

export interface PaymentSummaryCardProps {
    /** Total amount for the package */
    totalAmount: number;
    /** Amount already paid */
    amountPaid: number;
    /** Remaining balance to pay */
    remainingBalance: number;
    /** Array of payment history */
    payments?: IPayment<Date>[];
    /** Explicit refunded amount from booking or cancellation record */
    refundedAmount?: number;
    /** Optional overpayment record */
    overpayment?: IOverpaymentDetails<Date>;
    /** Optional original booking ID if transferred */
    rescheduledFromBookingId?: string;
    /** Optional target booking ID if moved */
    rescheduledToBookingId?: string;
    /** Optional shortcut handler to open linked booking */
    onNavigateToBooking?: (bookingId: string) => void;
}

const formatPaymentTimestamp = (dateVal?: unknown): string => {
    if (!dateVal) return 'Recently';
    const dateObj = (dateVal && typeof dateVal === 'object' && 'toDate' in dateVal && typeof (dateVal as { toDate: () => Date }).toDate === 'function')
        ? (dateVal as { toDate: () => Date }).toDate()
        : safeParseDateString(dateVal as string | Date);
    return dateObj.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Card displaying audited payment summary, including itemized payment installments,
 * reference codes, refunds, excess overpayments, and remaining balance.
 * 
 * @param {PaymentSummaryCardProps} props - Component props
 */
const PaymentSummaryCard = ({
    totalAmount,
    amountPaid,
    remainingBalance,
    payments = [],
    refundedAmount,
    overpayment,
    rescheduledFromBookingId,
    rescheduledToBookingId,
    onNavigateToBooking,
}: PaymentSummaryCardProps): React.JSX.Element => {
    const capturedPayments = payments.filter(p => p.status === 'captured');
    const refundedPayments = payments.filter(p => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));

    const calculatedRefunded = payments.reduce((sum, p) => {
        if (typeof p.refundedAmount === 'number' && p.refundedAmount > 0) {
            return sum + p.refundedAmount;
        }
        return sum + (p.status === 'refunded' ? (p.amount || 0) : 0);
    }, 0);

    const totalRefunded = (typeof refundedAmount === 'number' && refundedAmount > 0)
        ? refundedAmount
        : calculatedRefunded;

    const hasUnrecordedRefund = refundedPayments.some(p => {
        return p.refundedAmount === undefined || p.refundedAmount === null;
    }) && (typeof refundedAmount !== 'number' || refundedAmount <= 0);

    const totalOriginalAmountForRefunded = refundedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) || totalAmount;
    const refundPercentageLabel = (totalRefunded > 0 && totalOriginalAmountForRefunded > 0)
        ? ` (${Math.min(100, Math.round((totalRefunded / totalOriginalAmountForRefunded) * 100))}%)`
        : '';

    const hasExcess = Boolean(overpayment && overpayment.excessAmount > 0);

    const getExcessMeta = (status?: string, walletType?: string) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Excess Refunded',
                    meta: `Refund confirmed & credited to ${walletType || 'e-wallet'}`,
                    color: Colors.PRIMARY,
                };
            case 'awaiting_user_confirmation':
                return {
                    label: 'Excess Refund Sent',
                    meta: 'Payout proof uploaded — awaiting your confirmation',
                    color: Colors.WARNING,
                };
            case 'refund_disputed':
                return {
                    label: 'Excess Refund Disputed',
                    meta: 'Payout reported not received',
                    color: Colors.ERROR,
                };
            case 'awaiting_hiker_wallet':
                return {
                    label: 'Excess Paid (To be Refunded)',
                    meta: 'Overpayment awaiting e-wallet submission',
                    color: Colors.WARNING,
                };
            case 'awaiting_admin_payout':
            default:
                return {
                    label: 'Excess Paid (To be Refunded)',
                    meta: 'Overpayment awaiting organizer payout',
                    color: Colors.WARNING,
                };
        }
    };

    const excessMeta = getExcessMeta(overpayment?.status, overpayment?.userWallet?.walletType);

    return (
        <View style={styles.container}>
            <CustomText variant="label" style={styles.title}>
                Payment Summary
            </CustomText>

            <View style={styles.row}>
                <CustomText variant="caption" style={styles.label}>
                    Total Package Amount
                </CustomText>
                <CustomText variant="body" style={styles.packageValue}>
                    ₱{totalAmount.toFixed(2)}
                </CustomText>
            </View>

            <View style={styles.divider} />

            {/* Audited Payment History Section */}
            <CustomText variant="caption" style={styles.sectionHeader}>
                PAYMENT HISTORY ({capturedPayments.length} {capturedPayments.length === 1 ? 'PAYMENT' : 'PAYMENTS'})
            </CustomText>

            {capturedPayments.length > 0 ? (
                capturedPayments.map((cp, cIdx) => {
                    const paymentLabel = cIdx === 0
                        ? "Deposit Paid"
                        : (cIdx === 1 && capturedPayments.length === 2 ? "Remaining Balance Paid" : `Payment #${cIdx + 1}`);
                    const paymentTimestamp = formatPaymentTimestamp(cp.paidAt || cp.createdAt || cp.verifiedAt);
                    const refLabel = cp.referenceCode ? `Ref: ${cp.referenceCode}` : 'Ref: N/A';

                    return (
                        <View key={cIdx} style={styles.paymentItemContainer}>
                            <View style={styles.paymentHeaderRow}>
                                <CustomText variant="body" style={styles.paymentName}>
                                    {cIdx + 1}. {paymentLabel}
                                </CustomText>
                                <CustomText variant="body" style={styles.paidValue}>
                                    -₱{(cp.amount || 0).toFixed(2)}
                                </CustomText>
                            </View>
                            <View style={styles.paymentMetaRow}>
                                <CustomText variant="caption" style={styles.paymentMeta}>
                                    {paymentTimestamp}
                                </CustomText>
                                <CustomText variant="caption" style={styles.paymentMeta}>
                                    {refLabel}
                                </CustomText>
                            </View>
                        </View>
                    );
                })
            ) : (
                amountPaid > 0 ? (
                    <View style={styles.paymentItemContainer}>
                        <View style={styles.paymentHeaderRow}>
                            <CustomText variant="body" style={styles.paymentName}>
                                1. Deposit Paid
                            </CustomText>
                            <CustomText variant="body" style={styles.paidValue}>
                                -₱{amountPaid.toFixed(2)}
                            </CustomText>
                        </View>
                    </View>
                ) : (
                    <View style={styles.paymentItemContainer}>
                        <CustomText variant="caption" style={styles.paymentMeta}>
                            No verified payments yet.
                        </CustomText>
                    </View>
                )
            )}


            {hasExcess && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={styles.flexCol}>
                            <CustomText variant="body" style={[styles.paymentName, { color: excessMeta.color }]}>
                                {excessMeta.label}
                            </CustomText>
                            <CustomText variant="caption" style={styles.paymentMeta}>
                                {excessMeta.meta}
                            </CustomText>
                        </View>
                        <CustomText variant="body" style={[styles.paidValue, { color: excessMeta.color }]}>
                            +₱{(overpayment?.excessAmount || 0).toFixed(2)}
                        </CustomText>
                    </View>
                </>
            )}

            {(totalRefunded > 0 || refundedPayments.length > 0) && (
                <>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <CustomText variant="caption" style={[styles.label, { color: Colors.ERROR }]}>
                            Amount Refunded{refundPercentageLabel}
                        </CustomText>
                        <CustomText variant="body" style={[styles.packageValue, { color: Colors.ERROR }]}>
                            {hasUnrecordedRefund && totalRefunded === 0
                                ? 'Not recorded'
                                : `-₱${totalRefunded.toFixed(2)}`
                            }
                        </CustomText>
                    </View>
                </>
            )}

            <View style={styles.balanceContainer}>
                <CustomText variant="label" style={styles.balanceLabel}>
                    Remaining Balance
                </CustomText>
                <CustomText
                    variant="h3"
                    style={[
                        styles.balanceAmountText,
                        { color: remainingBalance <= 0 ? Colors.PRIMARY : Colors.WARNING },
                    ]}
                >
                    ₱{remainingBalance.toFixed(2)}
                </CustomText>
            </View>
        </View>
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
        ...GlobalStyles.dropShadow(2),
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 14,
    },
    packageValue: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 14,
    },
    paymentItemContainer: {
        marginBottom: 12,
    },
    paymentHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentName: {
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
        flex: 1,
    },
    paidValue: {
        fontWeight: '700',
        color: Colors.SUCCESS,
        fontSize: 14,
        marginLeft: 8,
    },
    paymentMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    paymentMeta: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    flexCol: {
        flex: 1,
    },
    balanceContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    balanceAmountText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default PaymentSummaryCard;
