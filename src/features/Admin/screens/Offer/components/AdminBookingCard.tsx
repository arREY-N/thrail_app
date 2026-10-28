import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import CustomStatusBadge from '@/src/components/CustomStatusBadge';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { Booking, IPayment } from '@/src/core/models/Booking/Booking';
import { formatBookingDate } from '@/src/utils/dateFormatter';

import { Cancellation } from '@/src/core/models/Cancellation/Cancellation';

export interface AdminBookingCardProps {
    booking: Booking;
    offerId: string;
    onViewBooking: (bookingId: string, offerId: string) => void;
    isOfferLocked?: boolean;
    style?: StyleProp<ViewStyle>;
    cancellation?: Cancellation;
}

/**
 * AdminBookingCard — Displays an individual booking entry within an offer's detail view.
 */
const AdminBookingCard = ({ 
    booking, 
    offerId, 
    onViewBooking,
    isOfferLocked = false,
    style,
    cancellation,
}: AdminBookingCardProps) => {
    const hasRefundedPayment = booking?.payment?.some((p: IPayment<Date>) => p.status === 'refunded' || ((p.refundedAmount || 0) > 0));
    const isVerifyingPayment = booking.paymentVerificationStatus === 'pending_verification' ||
        Boolean(booking.payment?.some((p: IPayment<Date>) => p.gateway === 'manual_qr' && p.status === 'pending'));

    const isRefundComplete =
        booking.status === 'refunded' ||
        cancellation?.status === 'refund_completed' ||
        cancellation?.handshakeStep === 'completed' ||
        (hasRefundedPayment && booking.status !== 'refund');

    const isRefunding =
        booking.status === 'refund' ||
        (cancellation?.status === 'approved' && ['hiker_details_submitted', 'admin_payout_sent', 'user_declined_receipt', 'refund_disputed'].includes(cancellation?.handshakeStep || ''));

    const displayStatus = isRefundComplete
        ? 'refunded'
        : (isRefunding
            ? 'refund'
            : (cancellation && cancellation.status === 'pending' && cancellation.cancelledBy === 'user' && booking.status !== 'cancelled'
                ? 'for-cancellation'
                : (isVerifyingPayment && booking.status === 'for-payment'
                    ? 'verifying-payment'
                    : booking.status)));

    const requiresAdminAction = !isOfferLocked && ['for-reservation', 'verifying-payment', 'downpayment', 'paid', 'for-cancellation', 'for-reschedule', 'refund'].includes(displayStatus);

    const firstName = booking.user?.firstname || 'Unknown';
    const lastName = booking.user?.lastname || 'Hiker';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    const isCancellation = displayStatus === 'for-cancellation';

    return (
        <TouchableOpacity 
            style={[
                styles.bookingCard, 
                isCancellation 
                    ? styles.cancellationBorder 
                    : (requiresAdminAction ? styles.highlightBorder : null),
                style,
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
            
            <CustomStatusBadge
                statusKey={displayStatus}
                role="admin"
                size="sm"
                style={styles.statusBadge}
            />
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
    cancellationBorder: {
        borderColor: Colors.ERROR,
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
        alignSelf: 'center',
        flexShrink: 0,
    },
});

export default React.memo(AdminBookingCard);
