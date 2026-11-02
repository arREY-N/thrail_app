/**
 * @file BookingCardBanner.tsx
 * @description Dedicated contextual banner for BookingCard displaying stacked rejection reasons
 * or reschedule notifications. Uses clean typography without icons for rejection callouts
 * to prevent visual clutter, adhering to Thrail design system tokens.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

interface BookingCardBannerProps {
    /** Effective status of the booking or rejection context */
    status?: string;
    /** Specific rejection or explanation reason text from organizer */
    reason?: string;
    /** Fallback message if no specific reason is provided */
    fallbackText?: string;
}

const BookingCardBanner = ({
    status,
    reason,
    fallbackText,
}: BookingCardBannerProps): React.JSX.Element | null => {
    if (!status) return null;

    // 1. Rejection reasons: reservation-rejected, payment-rejected, cancellation-rejected
    const isRejection = [
        'reservation-rejected',
        'payment-rejected',
        'cancellation-rejected',
        'reschedule-rejected',
    ].includes(status);

    if (isRejection) {
        const defaultFallback = status === 'payment-rejected'
            ? 'Payment receipt rejected. Please tap to resubmit.'
            : status === 'reservation-rejected'
                ? 'Reservation documents rejected. Please tap to update documents.'
                : 'Request was declined by the organizer.';

        const displayText = reason?.trim() ? `"${reason.trim()}"` : (fallbackText || defaultFallback);

        return (
            <View style={styles.rejectionContainer}>
                <CustomText variant="caption" style={styles.rejectionHeader}>
                    REASON:
                </CustomText>
                <CustomText style={styles.rejectionBody} numberOfLines={1} ellipsizeMode="tail">
                    {displayText}
                </CustomText>
            </View>
        );
    }

    // 2. Reschedule pending banner
    if (status === 'for-reschedule') {
        return (
            <View style={styles.infoBanner}>
                <CustomText style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                    Reschedule request submitted. Organizer approval in progress.
                </CustomText>
            </View>
        );
    }

    // 3. Rescheduled confirmed banner
    if (status === 'rescheduled') {
        return (
            <View style={styles.successBanner}>
                <CustomText style={styles.successText} numberOfLines={1} ellipsizeMode="tail">
                    Booking rescheduled to a new date.
                </CustomText>
            </View>
        );
    }

    // Verifying payment and dispute banners are omitted per user directive (redundant)
    return null;
};

const styles = StyleSheet.create({
    rejectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.ERROR_BG,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 10,
        borderWidth: 1,
        borderColor: Colors.ERROR_BORDER,
        gap: 6,
    },
    rejectionHeader: {
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 0.5,
        color: Colors.ERROR,
        textTransform: 'uppercase',
        flexShrink: 0,
    },
    rejectionBody: {
        flex: 1,
        fontSize: 12,
        color: Colors.TEXT_PRIMARY,
        lineHeight: 16,
    },
    infoBanner: {
        backgroundColor: Colors.STATUS_PENDING_BG,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 10,
        borderWidth: 1,
        borderColor: Colors.STATUS_PENDING_BORDER,
    },
    infoText: {
        fontSize: 12,
        color: Colors.STATUS_PENDING_TEXT,
        fontWeight: '600',
        lineHeight: 16,
    },
    successBanner: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 10,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    successText: {
        fontSize: 12,
        color: Colors.PRIMARY,
        fontWeight: '600',
        lineHeight: 16,
    },
});

export default BookingCardBanner;

