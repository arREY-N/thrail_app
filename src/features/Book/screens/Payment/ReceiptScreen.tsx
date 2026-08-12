import { ScrollView, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { IBooking, IPayment } from '@/src/core/models/Booking/Booking';
import { formatBookingDate } from '@/src/utils/dateFormatter';

export interface ReceiptScreenProps {
    bookingData: IBooking;
    onFinish: () => void;
}

const ReceiptScreen = ({ 
    bookingData, 
    onFinish 
}: ReceiptScreenProps) => {
    const payments = Array.isArray(bookingData?.payment) ? bookingData.payment : [];
    const capturedPayments = payments.filter((p: IPayment<Date>) => p.status === 'captured');
    const refundedPayments = payments.filter((p: IPayment<Date>) => p.status === 'refunded');
    
    const latestPayment: IPayment<Date> = capturedPayments[capturedPayments.length - 1] || payments[0];
    
    const transactionRef = latestPayment?.referenceCode || latestPayment?.sessionId || `TRX-${bookingData?.id?.substring(0, 8).toUpperCase() || 'N/A'}`;
    const paymentMethod = latestPayment?.gateway || 'Online Payment';
    
    const totalAmount = bookingData?.offer?.price || 0;
    const isRefunded = (bookingData?.status as string) === 'refunded' || bookingData?.status === 'refund' || refundedPayments.length > 0;
    
    const totalPaid = capturedPayments.length > 0 
        ? capturedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) 
        : (isRefunded ? 0 : totalAmount);
        
    const totalRefunded = refundedPayments.reduce((sum, p: any) => sum + (p.refundedAmount || 0), 0);
    const hasUnrecordedRefund = refundedPayments.some((p: any) => p.refundedAmount === undefined || p.refundedAmount === null);

    const totalOriginalAmountForRefunded = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
    const refundPercentageLabel = (totalRefunded > 0 && totalOriginalAmountForRefunded > 0)
        ? ` (${Math.round((totalRefunded / totalOriginalAmountForRefunded) * 100)}%)`
        : '';
        
    const formattedDate = formatBookingDate(bookingData?.offer?.date);
    
    let datePaid = 'Recently';
    if (latestPayment?.createdAt) {
        const paymentDateObj = (latestPayment.createdAt as any).toDate ? (latestPayment.createdAt as any).toDate() : new Date(latestPayment.createdAt);
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
        headerColor = Colors.ERROR;
        headerIcon = "refresh-ccw";
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
                                <CustomText variant="body" style={[styles.value, { textTransform: 'capitalize' }]}>
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

                            {refundedPayments.length > 0 && (
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
                                    {isRefunded ? "Net Amount Paid" : "Amount Paid"}
                                </CustomText>
                                <CustomText variant="h2" style={[styles.totalValue, { color: isRefunded ? Colors.TEXT_PRIMARY : headerColor }]}>
                                    ₱{totalPaid.toFixed(2)}
                                </CustomText>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

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
    }
});

export default ReceiptScreen;
