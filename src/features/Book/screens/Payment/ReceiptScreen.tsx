import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ImagePreviewModal from '@/src/components/ImagePreviewModal';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';
import { formatBookingDate } from '@/src/utils/dateFormatter';
import React, { useState } from 'react';

export interface ReceiptScreenProps {
    bookingData: Booking;
    cancellation?: Cancellation | null;
    onFinish: () => void;
}

const ReceiptScreen = ({ 
    bookingData, 
    cancellation,
    onFinish 
}: ReceiptScreenProps) => {
    const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
    const payments = Array.isArray(bookingData?.payment) 
        ? bookingData.payment.filter((p: IPayment<Date>) => p.status !== 'abandoned')
        : [];
    const capturedPayments = payments.filter((p: IPayment<Date>) => p.status === 'captured');
    const refundedPayments = payments.filter((p: IPayment<Date>) => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));
    const calculatedRefunded = payments.reduce((sum: number, p: IPayment<Date>) => sum + (p.refundedAmount || (p.status === 'refunded' ? p.amount : 0)), 0);
    const totalRefunded = (typeof bookingData?.refundedAmount === 'number' && bookingData.refundedAmount > 0)
        ? bookingData.refundedAmount
        : (typeof cancellation?.refundAmount === 'number' && cancellation.refundAmount > 0
            ? cancellation.refundAmount
            : calculatedRefunded);
    const hasRefund = totalRefunded > 0 || refundedPayments.length > 0;
    
    const refundProofReceiptUrl = cancellation?.adminRefundReceiptUrl ||
        payments.find((p: IPayment<Date>) => Boolean(p.refundProofUrl))?.refundProofUrl;
    
    const latestPayment: IPayment<Date> = capturedPayments[capturedPayments.length - 1] || refundedPayments[refundedPayments.length - 1] || payments[0];
    
    // Prioritize official Payment ID (pay_...) over internal ledger ID (bal_...) or checkout sessionId (cs_...)
    const transactionRef = 
        (latestPayment?.gatewayId?.startsWith('pay_') ? latestPayment.gatewayId : null) ||
        (latestPayment?.referenceCode?.startsWith('pay_') ? latestPayment.referenceCode : null) ||
        latestPayment?.gatewayId ||
        latestPayment?.referenceCode ||
        latestPayment?.sessionId ||
        `TRX-${bookingData?.id?.substring(0, 8).toUpperCase() || 'N/A'}`;

    // Clean payment channel display (GCash / Maya / Card)
    const formatMethod = (method?: string, gateway?: string) => {
        const m = (method || '').toLowerCase();
        if (m === 'gcash') return 'GCash';
        if (m === 'maya' || m === 'paymaya') return 'Maya';
        if (m === 'card') return 'Credit / Debit Card';
        if (gateway?.toLowerCase() === 'paymongo') return 'PayMongo';
        return method || gateway || 'Online Payment';
    };

    const paymentMethod = formatMethod(latestPayment?.method, latestPayment?.gateway);
    
    const totalAmount = bookingData?.offer?.price || 0;
    const isRefunded = bookingData?.status === 'refunded' || bookingData?.status === 'refund' || hasRefund;
    
    const totalPaid = capturedPayments.length > 0 
        ? capturedPayments.reduce((sum: number, p: IPayment<Date>) => sum + (p.amount || 0), 0) 
        : (isRefunded ? 0 : totalAmount);
        
    const hasUnrecordedRefund = refundedPayments.some((p: IPayment<Date>) => p.refundedAmount === undefined || p.refundedAmount === null);

    const totalOriginalAmountForRefunded = refundedPayments.reduce((sum: number, p: IPayment<Date>) => sum + (p.amount || 0), 0);
    const refundPercentageLabel = (totalRefunded > 0 && totalOriginalAmountForRefunded > 0)
        ? ` (${Math.round((totalRefunded / totalOriginalAmountForRefunded) * 100)}%)`
        : '';
        
    const formattedDate = formatBookingDate(bookingData?.offer?.date);
    
    let datePaid = 'Recently';
    if (latestPayment?.createdAt) {
        const createdVal: unknown = latestPayment.createdAt;
        const paymentDateObj = (createdVal && typeof createdVal === 'object' && 'toDate' in createdVal && typeof (createdVal as { toDate: () => Date }).toDate === 'function')
            ? (createdVal as { toDate: () => Date }).toDate()
            : new Date(latestPayment.createdAt);
        datePaid = paymentDateObj.toLocaleDateString('en-PH', { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    }

    const isVerifying = bookingData?.status === 'paid';
    
    let headerTitle = isVerifying ? "Verifying Payment" : "Payment Successful!";
    let headerSubtitle = isVerifying 
        ? "Your transaction receipt has been sent. The provider is currently verifying it."
        : "Your transaction was verified. Present this digital receipt to your guide on the day of the hike.";
    
    let headerColor: string = Colors.PRIMARY; 
    let headerIcon: string = isVerifying ? "clock" : "check";

    if (isRefunded) {
        headerTitle = "Refund Processed!";
        headerSubtitle = "A refund has been processed for this booking. The refunded amount has been returned to your original payment method.";
        headerColor = Colors.SUCCESS;
        headerIcon = "check-circle";
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Official Receipt" 
                centerTitle={true} 
                onBackPress={onFinish} 
            />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    <View style={styles.successHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: headerColor }]}>
                            <CustomIcon library="Feather" name={headerIcon} size={36} color={Colors.WHITE} />
                        </View>
                        <CustomText variant="h2" style={styles.successTitle}>
                            {headerTitle}
                        </CustomText>
                        <CustomText variant="body" style={styles.successSubtitle}>
                            {headerSubtitle}
                        </CustomText>
                    </View>

                    <View style={styles.ticketCard}>
                        <View style={styles.ticketHeader}>
                            <CustomText variant="h3" style={styles.trailName}>
                                {bookingData?.trail?.name || 'Trail Hike'}
                            </CustomText>
                            <CustomText variant="caption" style={styles.guideName}>
                                Reference: {transactionRef}
                            </CustomText>
                        </View>
                        
                        <View style={styles.dottedDivider} />
                        
                        <View style={styles.infoSection}>
                            <View style={styles.dataRow}>
                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Payment Method</CustomText>
                                <CustomText variant="body" style={styles.value}>
                                    {paymentMethod}
                                </CustomText>
                            </View>

                            <View style={styles.dataRow}>
                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Date Paid</CustomText>
                                <CustomText variant="body" style={styles.value}>{datePaid}</CustomText>
                            </View>

                            <View style={styles.divider} />

                            <CustomText variant="h3" style={styles.sectionTitle}>
                                Booking Details
                            </CustomText>

                            <View style={styles.dataRow}>
                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Hiker Name</CustomText>
                                <CustomText variant="body" style={styles.value} numberOfLines={1}>
                                    {bookingData?.user?.firstname} {bookingData?.user?.lastname}
                                </CustomText>
                            </View>

                            <View style={styles.dataRow}>
                                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Schedule</CustomText>
                                <CustomText variant="body" style={styles.value}>{formattedDate}</CustomText>
                            </View>

                            <View style={styles.divider} />

                            {capturedPayments.length > 1 && (
                                <>
                                    {capturedPayments.map((cp, cIdx) => (
                                        <View key={cIdx} style={styles.dataRow}>
                                            <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                                                {cIdx === 0 ? "Deposit (50%)" : "Remaining Balance"} ({formatMethod(cp.method, cp.gateway)})
                                            </CustomText>
                                            <CustomText variant="body" style={styles.value}>
                                                ₱{(cp.amount || 0).toFixed(2)}
                                            </CustomText>
                                        </View>
                                    ))}
                                    <View style={styles.divider} />
                                </>
                            )}

                            {(totalRefunded > 0 || refundedPayments.length > 0) && (
                                <>
                                    <View style={styles.dataRow}>
                                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                                            Amount Refunded{refundPercentageLabel}
                                        </CustomText>
                                        <CustomText variant="body" style={[styles.value, { color: Colors.ERROR }]}>
                                            {hasUnrecordedRefund && totalRefunded === 0
                                                ? 'Not recorded'
                                                : `₱${totalRefunded.toFixed(2)}`
                                            }
                                        </CustomText>
                                    </View>
                                    <View style={styles.divider} />
                                </>
                            )}

                            <View style={styles.totalRow}>
                                <CustomText variant="body" style={styles.totalLabel}>
                                    {isRefunded && totalRefunded > 0 ? "Net Amount Paid" : (isRefunded ? "Amount Paid" : "Amount Paid")}
                                </CustomText>
                                <CustomText variant="h2" style={[styles.totalValue, { color: isRefunded ? Colors.TEXT_PRIMARY : headerColor }]}>
                                    ₱{(isRefunded && totalRefunded > 0 ? Math.max(0, totalPaid - totalRefunded) : totalPaid).toFixed(2)}
                                </CustomText>
                            </View>
                        </View>
                    </View>

                    {Boolean(refundProofReceiptUrl) && (
                        <View style={styles.refundProofCard}>
                            <View style={styles.refundProofHeader}>
                                <View style={styles.refundProofIconBox}>
                                    <CustomIcon library="Feather" name="check-circle" size={18} color={Colors.SUCCESS} />
                                </View>
                                <View style={styles.refundProofHeaderTextGroup}>
                                    <CustomText variant="label" style={styles.refundProofTitle}>
                                        Organizer Refund Receipt Proof
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.refundProofSubtitle}>
                                        Official payout proof transferred to your e-wallet.
                                    </CustomText>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.viewProofButton}
                                onPress={() => setPreviewProofUrl(refundProofReceiptUrl || null)}
                                activeOpacity={0.8}
                            >
                                <CustomIcon library="Feather" name="eye" size={16} color={Colors.PRIMARY} />
                                <CustomText style={styles.viewProofButtonText}>View Refund Receipt Proof</CustomText>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {previewProofUrl && (
                <ImagePreviewModal
                    visible={Boolean(previewProofUrl)}
                    imageUrl={previewProofUrl}
                    onClose={() => setPreviewProofUrl(null)}
                />
            )}

            <CustomStickyFooter
                primaryButton={{
                    title: "Close Receipt",
                    onPress: onFinish
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
    },
    scrollContent: { 
        paddingTop: 32, 
        paddingBottom: 120 
    },
    successHeader: { 
        alignItems: 'center', 
        marginBottom: 32 
    },
    iconCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 
         
         
         
        ...GlobalStyles.dropShadow(3), 
    },
    successTitle: { 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 8, 
        textAlign: 'center' 
    },
    successSubtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 22, 
        paddingHorizontal: 15 
    },
    ticketCard: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        overflow: 'hidden', 
         
         
         
         
        ...GlobalStyles.dropShadow(3), 
        marginBottom: 24 
    },
    ticketHeader: { 
        padding: 24, 
        backgroundColor: Colors.WHITE, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT 
    },
    trailName: { 
        color: Colors.PRIMARY, 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 4 
    },
    guideName: { 
        color: Colors.TEXT_SECONDARY 
    },
    dottedDivider: { 
        height: 1, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        borderStyle: 'dashed', 
        marginHorizontal: -10 
    },
    infoSection: { 
        padding: 24 
    },
    sectionTitle: { 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 16 
    },
    dataRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    dataColumn: { 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        marginBottom: 16 
    },
    value: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        textAlign: 'right', 
        flex: 1, 
        marginLeft: 16 
    },
    longValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        textAlign: 'left' 
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        marginVertical: 12 
    },
    totalRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 4 
    },
    totalLabel: { 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY 
    },
    totalValue: { 
        fontWeight: 'bold' 
    },
    refundProofCard: {
        marginTop: 16,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    refundProofHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    refundProofIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    refundProofHeaderTextGroup: {
        flex: 1,
    },
    refundProofTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    refundProofSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginTop: 2,
    },
    viewProofButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.PRIMARY,
    },
    viewProofButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.PRIMARY,
    }
});

export default ReceiptScreen;
