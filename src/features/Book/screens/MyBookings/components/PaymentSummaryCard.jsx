import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const PaymentSummaryCard = ({ totalAmount, amountPaid, remainingBalance }) => {
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

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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