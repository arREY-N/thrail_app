import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

const AdminPaymentTab = ({ 
    booking, 
    currentStatus, 
    isApprovedStatus, 
    isRejectedStatus,
    isCancelledStatus,
    onConfirmPaymentClick 
}) => {
    return (
        <View style={styles.tabContent}>
            
            {currentStatus === 'for-payment' && !isCancelledStatus && (
                <View style={styles.emptyPaymentBox}>
                    <CustomIcon 
                        library="Feather" 
                        name="clock" 
                        size={32} 
                        color={Colors.STATUS_PENDING_TEXT} 
                        style={{ marginBottom: 12 }} 
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
                            <CustomIcon 
                                library="Feather" 
                                name="check-circle" 
                                size={16} 
                                color={Colors.SUCCESS} 
                            />
                            <CustomText style={styles.successBadgeText}>
                                Payment Verified & Completed
                            </CustomText>
                        </View>
                    )}
                    
                    {currentStatus === 'downpayment' && (
                        <View 
                            style={[
                                styles.warningBadge, 
                                { backgroundColor: Colors.STATUS_DOWNPAYMENT_BG }
                            ]}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="alert-circle" 
                                size={16} 
                                color={Colors.STATUS_DOWNPAYMENT_TEXT} 
                            />
                            <CustomText 
                                style={[
                                    styles.warningBadgeText, 
                                    { color: Colors.STATUS_DOWNPAYMENT_TEXT }
                                ]}
                            >
                                PENDING REMAINING BALANCE (50%)
                            </CustomText>
                        </View>
                    )}

                    {currentStatus === 'paid' && (
                        <View 
                            style={[
                                styles.fullPaidBadge, 
                                { backgroundColor: Colors.STATUS_FULLY_PAID_BG }
                            ]}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="check-circle" 
                                size={16} 
                                color={Colors.STATUS_FULLY_PAID_TEXT} 
                            />
                            <CustomText 
                                style={[
                                    styles.fullPaidBadgeText, 
                                    { color: Colors.STATUS_FULLY_PAID_TEXT }
                                ]}
                            >
                                FULLY PAID (100%)
                            </CustomText>
                        </View>
                    )}

                    <CustomText variant="h3" style={styles.summaryTitle}>
                        Transaction Summary
                    </CustomText>
                    
                    {booking?.payment?.map((paymentRecord, idx) => (
                        <View key={idx} style={styles.paymentRecordBox}>
                            <View style={styles.detailRow}>
                                <CustomText variant="caption" style={styles.detailLabel}>
                                    Gateway
                                </CustomText>
                                <CustomText 
                                    variant="body" 
                                    style={styles.detailValue} 
                                    textTransform="capitalize"
                                >
                                    {paymentRecord.gateway || 'PayMongo'}
                                </CustomText>
                            </View>
                            
                            <View style={styles.detailRow}>
                                <CustomText variant="caption" style={styles.detailLabel}>
                                    Reference No.
                                </CustomText>
                                <CustomText 
                                    variant="body" 
                                    style={styles.detailValue} 
                                    numberOfLines={1}
                                >
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
                                        paymentRecord.status === 'refunded' ? { color: Colors.ERROR } : {}
                                    ]} 
                                    textTransform="uppercase"
                                >
                                    {paymentRecord.status}
                                </CustomText>
                            </View>

                            <View style={[styles.detailRow, { marginBottom: 0 }]}>
                                <CustomText variant="caption" style={styles.detailLabel}>
                                    Amount
                                </CustomText>
                                <CustomText variant="h3" style={[styles.totalValue, paymentRecord.status === 'refunded' ? { color: Colors.ERROR } : {}]}>
                                    ₱{paymentRecord.amount.toFixed(2)}
                                </CustomText>
                            </View>
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
                            style={{ marginTop: 16 }}
                        />
                    )}
                </View>
            )}

            {isCancelledStatus && (
                <View style={[styles.emptyPaymentBox, { borderColor: Colors.ERROR_BORDER, backgroundColor: Colors.ERROR_BG, marginTop: booking?.payment?.length > 0 ? 16 : 0 }]}>
                    <CustomIcon 
                        library="Feather" 
                        name="lock" 
                        size={32} 
                        color={Colors.ERROR} 
                        style={{ marginBottom: 12 }} 
                    />
                    <CustomText style={[styles.emptyPaymentText, { color: Colors.ERROR }]}>
                        Payment actions are locked because this booking has been Cancelled or Refunded.
                    </CustomText>
                </View>
            )}

            {!isApprovedStatus && !isRejectedStatus && !isCancelledStatus && (
                <View style={styles.emptyPaymentBox}>
                    <CustomIcon 
                        library="Feather" 
                        name="lock" 
                        size={32} 
                        color={Colors.GRAY_MEDIUM} 
                        style={{ marginBottom: 12 }} 
                    />
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
    downpaymentNote: { 
        color: Colors.TEXT_SECONDARY, 
        fontStyle: 'italic', 
        marginTop: 8, 
        marginBottom: 16, 
        textAlign: 'center' 
    }
});

export default AdminPaymentTab;