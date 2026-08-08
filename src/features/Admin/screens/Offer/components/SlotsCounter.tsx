/**
 * @file SlotsCounter.tsx
 * @description Component to calculate and display the number of reserved slots for an offer, indicating whether the minimum pax requirement is met.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { IBooking } from '@/src/core/models/Booking/Booking.types';

/**
 * Props for the SlotsCounter component.
 * 
 * @param bookings - List of bookings associated with this offer to measure reservation slots.
 * @param minPax - Minimum number of required participants.
 * @param maxPax - Maximum number of allowed participants.
 */
export interface SlotsCounterProps {
    bookings: IBooking[];
    minPax: number;
    maxPax: number;
}

/**
 * SlotsCounter — Calculates active slots from the bookings array and displays a counter badge.
 * Displays warning styling if minimum required pax is not met.
 */
const SlotsCounter: React.FC<SlotsCounterProps> = ({ 
    bookings = [], 
    minPax, 
    maxPax 
}) => {
    // Calculate active bookings that hold reserved slots
    const activeBookings = bookings.filter(b => {
        const status = b.status;
        return status === 'for-reservation' ||
               status === 'for-payment' ||
               status === 'paid' ||
               status === 'downpayment' ||
               status === 'completed' ||
               status === 'finished' ||
               status === 'for-cancellation' ||
               status === 'cancellation-rejected' ||
               status === 'for-reschedule' ||
               status === 'reschedule-rejected';
    });

    const reservedCount = activeBookings.length;
    const isMinMet = reservedCount >= minPax;

    return (
        <View style={[
            styles.slotsContainer,
            isMinMet ? styles.minMetBg : styles.minNotMetBg
        ]}>
            <CustomIcon 
                library="Feather" 
                name={isMinMet ? "check-circle" : "pie-chart"} 
                size={16} 
                color={isMinMet ? Colors.WHITE : Colors.PRIMARY}
                style={styles.badgeIcon} 
            />
            <CustomText variant="caption" style={[styles.slotsText, isMinMet ? styles.textSuccess : styles.textWarning]}>
                Slots: <Text style={styles.boldText}>{reservedCount}</Text> / {maxPax} Reserved (Min: {minPax})
            </CustomText>
        </View>
    );
};

const styles = StyleSheet.create({
    slotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 8,
        marginBottom: 12,
        width: '100%'
    },
    minMetBg: {
        backgroundColor: Colors.PRIMARY,
    },
    minNotMetBg: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    badgeIcon: {
        marginTop: 3
    },
    slotsText: {
        fontWeight: '600',
    },
    textSuccess: {
        color: Colors.WHITE,
    },
    textWarning: {
        color: Colors.PRIMARY,
    },
    boldText: {
        fontWeight: 'bold',
    }
});

export default SlotsCounter;
