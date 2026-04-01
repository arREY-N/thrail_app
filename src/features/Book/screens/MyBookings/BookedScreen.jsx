import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomStickyFooter from '@/src/components/CustomStickyFooter';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const getBadgeStyles = (status) => {
    if (status === 'paid' || status === 'completed') {
        return { bg: Colors.STATUS_APPROVED_BG, text: Colors.STATUS_APPROVED_TEXT, label: 'Paid' };
    }
    if (status === 'approved-docs') {
        return { bg: Colors.STATUS_APPROVED_BG, text: Colors.STATUS_APPROVED_TEXT, label: 'Approved' };
    }
    if (status === 'for-cancellation' || status === 'cancelled' || status === 'refund') {
        return { bg: Colors.STATUS_CANCELLED_BG, text: Colors.STATUS_CANCELLED_TEXT, label: 'Cancelled' };
    }
    return { 
        bg: Colors.STATUS_APPROVED_BG, 
        text: Colors.PRIMARY, 
        label: status === 'for-reservation' ? 'For-Reservation' : 'Pending' 
    };
};

const BookedScreen = ({ 
    booking, 
    onBackPress, 
    onProceedToPayment, 
    onReschedule, 
    onViewReceipt,
    onCancelConfirm 
}) => {
    const [isCanceling, setIsCanceling] = useState(false);

    const formattedDate = formatBookingDate(booking?.offer?.date);
    const badgeConfig = getBadgeStyles(booking?.status);
    
    const totalAmount = booking?.offer?.price || 0;
    const amountPaid = booking?.payment?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const remainingBalance = totalAmount - amountPaid;

    const getFooterConfig = () => {
        if (isCanceling) {
            return {
                secondaryButton: {
                    title: "Cancel Booking",
                    variant: "outline",
                    style: { borderColor: Colors.ERROR },
                    textStyle: { color: Colors.ERROR },
                    onPress: () => onCancelConfirm(booking, "User requested cancellation")
                },
                primaryButton: {
                    title: "Keep Booking",
                    variant: "primary",
                    onPress: () => setIsCanceling(false)
                }
            };
        }

        if (booking?.status === 'for-reservation' || booking?.status === 'pending-docs') {
            return {
                secondaryButton: { title: "Cancel", onPress: () => setIsCanceling(true) },
                primaryButton: { title: "Reschedule", variant: "outline", onPress: () => onReschedule(booking) }
            };
        }

        if (booking?.status === 'for-payment' || booking?.status === 'approved-docs') {
            return {
                secondaryButton: { title: "Cancel", onPress: () => setIsCanceling(true) },
                primaryButton: { title: "Proceed to Payment", onPress: () => onProceedToPayment(booking) }
            };
        }

        if (booking?.status === 'paid' || booking?.status === 'completed') {
            return {
                secondaryButton: { title: "Reschedule", onPress: () => onReschedule(booking) },
                primaryButton: { title: "View E-Ticket", onPress: () => onViewReceipt(booking) }
            };
        }

        return null; 
    };

    const footerConfig = getFooterConfig();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title={isCanceling ? "Cancel Booking" : "Booked"} 
                centerTitle={true} 
                onBackPress={isCanceling ? () => setIsCanceling(false) : onBackPress} 
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.card}>
                    <View style={styles.headerSection}>
                        <View style={styles.titleWrapper}>
                            <CustomText variant="h2" style={styles.trailName}>
                                {booking?.trail?.name || 'Trail Name'}
                            </CustomText>
                            <CustomText variant="caption" style={styles.guideName}>
                                {booking?.business?.name || 'Guide Name'}
                            </CustomText>
                        </View>
                        <View style={[
                            styles.badge, 
                            { backgroundColor: isCanceling ? Colors.ERROR_BG : badgeConfig.bg }
                        ]}>
                            <CustomText style={[
                                styles.badgeText, 
                                { color: isCanceling ? Colors.ERROR : badgeConfig.text }
                            ]}>
                                {isCanceling ? "Canceling" : badgeConfig.label}
                            </CustomText>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.dataRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Full Name</CustomText>
                        <CustomText variant="body" style={styles.value}>
                            {booking?.user?.firstname} {booking?.user?.lastname}
                        </CustomText>
                    </View>
                    
                    <View style={styles.dataRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Contact Number</CustomText>
                        <CustomText variant="body" style={styles.value}>
                            {booking?.emergencyContact?.contactNumber || 'N/A'}
                        </CustomText>
                    </View>

                    <View style={styles.dataRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Date & Time</CustomText>
                        <CustomText variant="body" style={styles.value}>
                            {formattedDate}
                        </CustomText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.dataRow}>
                        <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>Booking ID</CustomText>
                        <CustomText variant="body" style={styles.value}>
                            {booking?.id || 'N/A'}
                        </CustomText>
                    </View>

                    <View style={styles.dataRow}>
                        <CustomText variant="body" style={styles.boldLabel}>Amount Paid</CustomText>
                        <CustomText variant="body" style={styles.boldValuePrimary}>
                            ₱{amountPaid.toFixed(2)}
                        </CustomText>
                    </View>
                    
                    <View style={styles.dataRow}>
                        <CustomText variant="body" style={styles.boldLabel}>Total Amount</CustomText>
                        <CustomText variant="body" style={styles.boldValuePrimary}>
                            ₱{totalAmount.toFixed(2)}
                        </CustomText>
                    </View>

                    {remainingBalance > 0 && (
                        <View style={styles.dataRow}>
                            <CustomText variant="body" style={styles.boldLabel}>Remaining Balance</CustomText>
                            <CustomText variant="body" style={[styles.boldValuePrimary, { color: Colors.WARNING }]}>
                                ₱{remainingBalance.toFixed(2)}
                            </CustomText>
                        </View>
                    )}
                </View>

                {isCanceling && (
                    <View style={styles.warningContainer}>
                        <CustomIcon 
                            library="Feather" 
                            name="alert-triangle" 
                            size={20} 
                            color={Colors.WARNING} 
                        />
                        <View style={styles.warningTextWrapper}>
                            <CustomText style={styles.warningTextBold}>
                                Are you sure you want to cancel?
                            </CustomText>
                            <CustomText style={styles.warningText}>
                                This action cannot be undone. Refunds (if applicable) may take 3-7 business days to process.
                            </CustomText>
                        </View>
                    </View>
                )}
            </ScrollView>

            {footerConfig && (
                <CustomStickyFooter 
                    primaryButton={footerConfig.primaryButton}
                    secondaryButton={footerConfig.secondaryButton}
                />
            )}

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 100, 
    },
    card: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerSection: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
    },
    titleWrapper: { 
        flex: 1, 
        paddingRight: 12,
    },
    trailName: { 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 8,
        fontSize: 18,
        fontWeight: 'bold',
    },
    guideName: { 
        color: Colors.TEXT_SECONDARY, 
    },
    badge: { 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 16, 
    },
    badgeText: { 
        fontWeight: 'bold', 
        fontSize: 12,
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        marginVertical: 20, 
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
        textAlign: 'right',
        flex: 1,
        marginLeft: 20,
    },
    boldLabel: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold', 
    },
    boldValuePrimary: { 
        color: Colors.PRIMARY, 
        fontWeight: 'bold', 
    },
    warningContainer: { 
        marginTop: 24, 
        backgroundColor: Colors.ERROR_BG, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.ERROR_BORDER,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    warningTextWrapper: {
        flex: 1,
    },
    warningTextBold: { 
        color: Colors.ERROR, 
        fontWeight: 'bold', 
        marginBottom: 4, 
    },
    warningText: { 
        color: Colors.ERROR, 
        lineHeight: 20, 
    }
});

export default BookedScreen;