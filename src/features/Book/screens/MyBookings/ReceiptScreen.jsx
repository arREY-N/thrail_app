import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const ReceiptScreen = ({ 
    bookingData, 
    onFinish 
}) => {
    const capturedPayment = bookingData?.payment?.find(p => p.status === 'captured') || bookingData?.payment?.[0];
    const transactionRef = capturedPayment?.referenceCode || `TRX-${bookingData?.id?.toUpperCase() || 'N/A'}`;
    const formattedDate = formatBookingDate(bookingData?.offer?.date);
    const totalPaid = bookingData?.payment?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="E-Ticket" 
                centerTitle={true} 
                onBackPress={onFinish} 
            />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.successHeader}>
                    <View style={styles.iconCircle}>
                        <CustomIcon 
                            library="Feather" 
                            name="check" 
                            size={40} 
                            color={Colors.WHITE} 
                        />
                    </View>
                    <CustomText variant="h1" style={styles.successTitle}>
                        Booking Confirmed!
                    </CustomText>
                    <CustomText variant="body" style={styles.successSubtitle}>
                        Your payment was verified. Present this E-Ticket to your guide on the day of the hike.
                    </CustomText>
                </View>

                <View style={styles.ticketCard}>
                    <View style={styles.ticketHeader}>
                        <CustomText variant="h2" style={styles.trailName}>
                            {bookingData?.trail?.name || 'Trail Name'}
                        </CustomText>
                        <CustomText variant="caption" style={styles.guideName}>
                            Provided by {bookingData?.business?.name || 'Tour Guide'}
                        </CustomText>
                    </View>

                    <View style={styles.dottedDivider} />

                    <View style={styles.infoSection}>
                        <View style={styles.dataRow}>
                            <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Hiker Name</CustomText>
                            <CustomText variant="body" style={styles.value}>
                                {bookingData?.user?.firstname} {bookingData?.user?.lastname}
                            </CustomText>
                        </View>

                        <View style={styles.dataRow}>
                            <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Date & Time</CustomText>
                            <CustomText variant="body" style={styles.value}>{formattedDate}</CustomText>
                        </View>

                        <View style={styles.dataRow}>
                            <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Reference No.</CustomText>
                            <CustomText variant="body" style={styles.value}>{transactionRef}</CustomText>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.totalRow}>
                            <CustomText variant="body" style={styles.totalLabel}>Amount Paid</CustomText>
                            <CustomText variant="h2" style={styles.totalValue}>
                                ₱{totalPaid.toFixed(2)}
                            </CustomText>
                        </View>
                    </View>

                    <View style={styles.qrPlaceholder}>
                        <CustomIcon 
                            library="MaterialCommunityIcons" 
                            name="qrcode-scan" 
                            size={100} 
                            color={Colors.GRAY_LIGHT} 
                        />
                        <CustomText variant="caption" style={styles.qrText}>
                            SCAN FOR VERIFICATION
                        </CustomText>
                    </View>
                </View>

                <View style={styles.reminderBox}>
                    <CustomText variant="label" style={styles.reminderTitle}>
                        Important Reminders:
                    </CustomText>
                    <CustomText variant="caption" style={styles.reminderItem}>
                        • Bring a valid ID matching your registration.
                    </CustomText>
                    <CustomText variant="caption" style={styles.reminderItem}>
                        • Arrive at the jump-off point 30 minutes before the scheduled time.
                    </CustomText>
                </View>
            </ScrollView>

            <CustomStickyFooter
                primaryButton={{
                    title: "Done",
                    onPress: onFinish
                }}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        paddingHorizontal: 20, 
        paddingTop: 32, 
        paddingBottom: 120,
    },
    successHeader: { 
        alignItems: 'center', 
        marginBottom: 32,
    },
    iconCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: Colors.SUCCESS, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20,
        shadowColor: Colors.SUCCESS,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    successTitle: { 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 22,
        paddingHorizontal: 15,
    },
    ticketCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 24,
    },
    ticketHeader: {
        padding: 24,
        backgroundColor: Colors.WHITE,
    },
    trailName: {
        color: Colors.PRIMARY,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    guideName: {
        color: Colors.TEXT_SECONDARY,
    },
    dottedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        borderStyle: 'dashed',
        marginHorizontal: -10,
    },
    infoSection: {
        padding: 24,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    value: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    totalValue: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    qrPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    qrText: {
        marginTop: 12,
        letterSpacing: 2,
        color: Colors.GRAY_MEDIUM,
        fontWeight: 'bold',
    },
    reminderBox: {
        paddingHorizontal: 8,
    },
    reminderTitle: {
        color: Colors.TEXT_PRIMARY,
        marginBottom: 12,
    },
    reminderItem: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 8,
        lineHeight: 18,
    },
});

export default ReceiptScreen;