import React from 'react';
import { Platform,  StyleSheet, View  } from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IPayment } from '@/src/core/models/Booking/Booking.types';

export interface PaymentSummaryCardProps {
    /** Total amount for the package */
    totalAmount: number;
    /** Amount already paid */
    amountPaid: number;
    /** Remaining balance to pay */
    remainingBalance: number;
    /** Array of payment history */
    payments?: IPayment<any>[];
}

/**
 * Card displaying payment summary, including refunds and remaining balance.
 * 
 * @param {PaymentSummaryCardProps} props - Component props
 */
const PaymentSummaryCard = ({ totalAmount, amountPaid, remainingBalance, payments = [] }: PaymentSummaryCardProps) => {
    const refundedPayments = payments.filter(p => p.status === 'refunded');
    const totalRefunded = refundedPayments.reduce((sum, p) => sum + (((p as unknown as { refundedAmount?: number }).refundedAmount) || 0), 0);
    const hasUnrecordedRefund = refundedPayments.some(p => {
        const refundedAmount = (p as unknown as { refundedAmount?: number }).refundedAmount;
        return refundedAmount === undefined || refundedAmount === null;
    });

    const totalOriginalAmountForRefunded = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
    const refundPercentageLabel = (totalRefunded > 0 && totalOriginalAmountForRefunded > 0)
        ? ` (${Math.round((totalRefunded / totalOriginalAmountForRefunded) * 100)}%)`
        : '';

    return (
        <View style={styles.container}>
            <CustomText variant="label" style={styles.title}>
                Payment Summary
            </CustomText>

            <View style={styles.row}>
                <CustomText variant="caption" style={styles.label}>
                    Total Package Amount
                </CustomText>
                <CustomText variant="body" style={styles.value}>
                    ₱{totalAmount.toFixed(2)}
                </CustomText>
            </View>

            <View style={styles.row}>
                <CustomText variant="caption" style={styles.label}>
                    Deposit Paid
                </CustomText>
                <CustomText variant="body" style={[styles.value, { color: Colors.SUCCESS }]}>
                    -₱{amountPaid.toFixed(2)}
                </CustomText>
            </View>

            {refundedPayments.length > 0 && (
                <View style={styles.row}>
                    <CustomText variant="caption" style={[styles.label, { color: Colors.ERROR }]}>
                        Amount Refunded{refundPercentageLabel}
                    </CustomText>
                    <CustomText variant="body" style={[styles.value, { color: Colors.ERROR }]}>
                        {hasUnrecordedRefund && totalRefunded === 0
                            ? 'Not recorded'
                            : `₱${totalRefunded.toFixed(2)}`
                        }
                    </CustomText>
                </View>
            )}

            <View style={styles.balanceContainer}>
                <CustomText variant="label" style={styles.balanceLabel}>
                    Remaining Balance
                </CustomText>
                <View style={styles.balanceAmountBox}>
                    <CustomText variant="h3" style={styles.balanceAmountText}>
                        ₱{remainingBalance.toFixed(2)}
                    </CustomText>
                </View>
            </View>
        </View>
    );
};

const dropShadow = GlobalStyles.dropShadow(3);

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        
        
        
        
        ...dropShadow,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        color: Colors.TEXT_SECONDARY,
    },
    value: {
        fontWeight: '600',
    },
    balanceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
    },
    balanceLabel: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    balanceAmountBox: {
        backgroundColor: '#006B2B', 
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    balanceAmountText: {
        color: Colors.WHITE,
        marginBottom: 0, 
    },
});

export default PaymentSummaryCard;
