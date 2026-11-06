/**
 * @file PaymentBreakdownPanel.tsx
 * @description Standardized financial breakdown metrics component.
 * Displays Total Price, Amount Already Paid, Remaining Balance, and optional Refunded Amount.
 * Features built-in responsive wrapping (2x2 grid on mobile viewports) to eliminate layout collision.
 */

import React from 'react';
import {
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export interface PaymentBreakdownPanelProps {
    totalPrice: number;
    amountPaid: number;
    remainingBalance: number;
    refundedAmount?: number;
    variant?: 'compact' | 'hero' | 'receipt';
    style?: StyleProp<ViewStyle>;
}

const PaymentBreakdownPanel: React.FC<PaymentBreakdownPanelProps> = ({
    totalPrice,
    amountPaid,
    remainingBalance,
    refundedAmount = 0,
    variant = 'compact',
    style,
}) => {
    const { width } = useBreakpoints();
    const isNarrow = width < 360;

    const hasRefund = refundedAmount > 0;
    const isSettled = remainingBalance <= 0;

    const formatCurrency = (val: number) => `₱${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <View
            style={[
                styles.container,
                styles[`container_${variant}`],
                (isNarrow || hasRefund) && styles.containerWrapped,
                style,
            ]}
        >
            {/* Column 1: Total Price */}
            <View style={[styles.column, (isNarrow || hasRefund) && styles.columnHalf]}>
                <View style={styles.labelContainer}>
                    <CustomText variant="caption" style={styles.label} numberOfLines={2}>
                        Total Price
                    </CustomText>
                </View>
                <CustomText
                    variant={variant === 'hero' ? 'h2' : 'h3'}
                    style={[styles.value, styles.valueTotal]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                >
                    {formatCurrency(totalPrice)}
                </CustomText>
            </View>

            {!(isNarrow || hasRefund) && <View style={styles.divider} />}

            {/* Column 2: Amount Paid */}
            <View style={[styles.column, (isNarrow || hasRefund) && styles.columnHalf]}>
                <View style={styles.labelContainer}>
                    <CustomText variant="caption" style={styles.label} numberOfLines={2}>
                        {variant === 'receipt' ? 'Amount Already Paid' : 'Paid'}
                    </CustomText>
                </View>
                <CustomText
                    variant={variant === 'hero' ? 'h2' : 'h3'}
                    style={[styles.value, { color: Colors.SUCCESS }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                >
                    {formatCurrency(amountPaid)}
                </CustomText>
            </View>

            {hasRefund && (
                <View style={[styles.column, styles.columnHalf]}>
                    <View style={styles.labelContainer}>
                        <CustomText variant="caption" style={[styles.label, { color: Colors.ERROR }]} numberOfLines={2}>
                            Refunded
                        </CustomText>
                    </View>
                    <CustomText
                        variant={variant === 'hero' ? 'h2' : 'h3'}
                        style={[styles.value, { color: Colors.ERROR }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.75}
                    >
                        {formatCurrency(refundedAmount)}
                    </CustomText>
                </View>
            )}

            {!(isNarrow || hasRefund) && <View style={styles.divider} />}

            {/* Column 3: Remaining Balance */}
            <View style={[styles.column, (isNarrow || hasRefund) && styles.columnHalf]}>
                <View style={styles.labelContainer}>
                    <CustomText variant="caption" style={styles.label} numberOfLines={2}>
                        Remaining Balance
                    </CustomText>
                </View>
                <CustomText
                    variant={variant === 'hero' ? 'h2' : 'h3'}
                    style={[
                        styles.value,
                        { color: isSettled ? Colors.PRIMARY : Colors.WARNING },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.75}
                >
                    {formatCurrency(remainingBalance)}
                </CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        width: '100%',
    },
    container_compact: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderColor: Colors.GRAY_LIGHT,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    container_hero: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: Colors.WHITE,
        borderColor: Colors.GRAY_LIGHT,
    },
    container_receipt: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: Colors.WHITE,
        borderColor: Colors.GRAY_LIGHT,
    },
    containerWrapped: {
        flexWrap: 'wrap',
        rowGap: 12,
    },
    column: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 4,
    },
    columnHalf: {
        flexBasis: '48%',
        flexGrow: 1,
        alignItems: 'flex-start',
        paddingHorizontal: 6,
    },
    divider: {
        width: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        alignSelf: 'stretch',
        marginVertical: 4,
    },
    labelContainer: {
        height: 28,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 6,
        width: '100%',
    },
    label: {
        fontSize: 9.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    value: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        width: '100%',
    },
    valueTotal: {
        color: Colors.TEXT_PRIMARY,
    },
});

export default PaymentBreakdownPanel;
