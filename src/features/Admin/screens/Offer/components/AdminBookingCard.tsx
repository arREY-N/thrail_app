import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { formatBookingDate } from '@/src/utils/dateFormatter';

export interface AdminBookingCardProps {
    booking: any;
    offerId: string;
    onViewBooking: (bookingId: string, offerId: string) => void;
    isOfferLocked?: boolean;
}

/**
 * AdminBookingCard — Displays an individual booking entry within an offer's detail view.
 */
const AdminBookingCard = ({ 
    booking, 
    offerId, 
    onViewBooking,
    isOfferLocked = false
}: AdminBookingCardProps) => {
    const hasRefundedPayment = booking?.payment?.some((p: any) => p.status === 'refunded');
    const displayStatus = hasRefundedPayment ? 'refunded' : booking.status;

    const statusConfig = getStatusConfig(displayStatus, 'admin');
    
    const requiresAdminAction = !isOfferLocked && ['for-reservation', 'pending-docs', 'downpayment', 'paid'].includes(displayStatus);

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
            
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                <CustomIcon 
                    library="Feather" 
                    name={statusConfig.icon} 
                    size={10} 
                    color={statusConfig.textColor} 
                />
                <CustomText variant="caption" style={[styles.badgeText, { color: statusConfig.textColor }]}>
                    {statusConfig.label}
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 8,
        gap: 4
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold'
    },
});

export default AdminBookingCard;
