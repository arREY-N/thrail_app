import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const AdminBookingCard = ({ 
    booking, 
    offerId, 
    onViewBooking 
}) => {
    const isNeedsReview = booking.status === 'pending-docs' || booking.status === 'for-reservation';
    const isDownpayment = booking.status === 'downpayment';
    const isFullyPaid = booking.status === 'paid';
    const isCompleted = booking.status === 'completed';
    const isForPayment = booking.status === 'for-payment';
    const isRejected = booking.status === 'reservation-rejected' || booking.status === 'cancelled';
    
    const requiresAdminAction = isNeedsReview || isDownpayment || isFullyPaid;
    
    let statusColor = Colors.TEXT_SECONDARY;
    let bgColor = Colors.GRAY_ULTRALIGHT;
    let statusText = (booking.status || 'unknown').toUpperCase().replace('-', ' ');

    if (isNeedsReview) {
        statusColor = Colors.STATUS_NEEDS_REVIEW_TEXT;
        bgColor = Colors.STATUS_NEEDS_REVIEW_BG;
        statusText = "NEEDS REVIEW";
    } else if (isForPayment) {
        statusColor = Colors.STATUS_WAITING_USER_TEXT;
        bgColor = Colors.STATUS_WAITING_USER_BG;
        statusText = "FOR PAYMENT";
    } else if (isDownpayment) {
        statusColor = Colors.STATUS_DOWNPAYMENT_TEXT;
        bgColor = Colors.STATUS_DOWNPAYMENT_BG;
        statusText = "DOWNPAYMENT (50%)";
    } else if (isFullyPaid) {
        statusColor = Colors.STATUS_FULLY_PAID_TEXT;
        bgColor = Colors.STATUS_FULLY_PAID_BG;
        statusText = "FULLY PAID";
    } else if (isCompleted) {
        statusColor = Colors.SUCCESS;
        bgColor = Colors.STATUS_APPROVED_BG;
    } else if (isRejected) {
        statusColor = Colors.ERROR;
        bgColor = Colors.ERROR_BG;
    } 

    const firstName = booking.user?.firstname || 'Unknown';
    const lastName = booking.user?.lastname || 'Hiker';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    return (
        <TouchableOpacity 
            style={[
                styles.bookingCard, 
                requiresAdminAction && styles.highlightBorder 
            ]}
            onPress={() => onViewBooking(booking.id, offerId)}
            activeOpacity={0.7}
        >
            <View style={styles.hikerInfo}>
                <View style={styles.avatar}>
                    <CustomText style={styles.avatarInitials}>
                        {initials}
                    </CustomText>
                </View>
                
                <View style={styles.hikerTextGroup}>
                    <CustomText variant="label" style={styles.hikerName} numberOfLines={1}>
                        {firstName} {lastName}
                    </CustomText>
                    <CustomText variant="caption">
                        {formatBookingDate(booking.createdAt)}
                    </CustomText>
                </View>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                <CustomText variant="caption" style={[styles.badgeText, { color: statusColor }]}>
                    {statusText}
                </CustomText>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    bookingCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        padding: 16, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 12 
    },
    highlightBorder: { 
        borderColor: Colors.PRIMARY, 
        borderWidth: 1.5 
    },
    hikerInfo: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        flex: 1 
    },
    avatar: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: Colors.PRIMARY, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    avatarInitials: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    hikerTextGroup: { 
        flex: 1 
    },
    hikerName: { 
        fontSize: 15, 
        fontWeight: '600', 
        flexShrink: 1 
    },
    statusBadge: { 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 20, 
        marginLeft: 8 
    },
    badgeText: { 
        fontSize: 10, 
        fontWeight: 'bold' 
    }
});

export default AdminBookingCard;