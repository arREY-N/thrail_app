import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const getHeroBadgeStyle = (status) => {
    switch (status) {
        case 'for-reservation': 
            return { 
                label: 'PENDING', 
                bgColor: Colors.STATUS_PENDING_BG, 
                textColor: Colors.STATUS_PENDING_TEXT 
            };
        case 'for-payment': 
            return { 
                label: 'APPROVED', 
                bgColor: Colors.STATUS_APPROVED_BG, 
                textColor: Colors.STATUS_APPROVED_TEXT 
            };
        case 'paid':
            return { 
                label: 'VERIFYING', 
                bgColor: Colors.STATUS_PENDING_BG, 
                textColor: Colors.STATUS_PENDING_TEXT 
            };
        case 'completed':
            return { 
                label: 'CONFIRMED', 
                bgColor: Colors.STATUS_APPROVED_BG, 
                textColor: Colors.PRIMARY 
            };
        case 'for-cancellation':
        case 'cancellation-rejected':
        case 'refund': 
        case 'cancelled':
            return { 
                label: 'CANCELLED', 
                bgColor: Colors.STATUS_CANCELLED_BG, 
                textColor: Colors.STATUS_CANCELLED_TEXT 
            };
        case 'for-reschedule':
        case 'reschedule-rejected':
        case 'rescheduled': 
            return { 
                label: 'RESCHEDULING', 
                bgColor: Colors.STATUS_PENDING_BG, 
                textColor: Colors.STATUS_PENDING_TEXT 
            };
        default: 
            return { 
                label: 'UNKNOWN', 
                bgColor: Colors.GRAY_ULTRALIGHT, 
                textColor: Colors.TEXT_SECONDARY 
            };
    }
};

const HeroHeader = ({ booking }) => {
    const badge = getHeroBadgeStyle(booking?.status);
    const trail = booking?.trail;

    return (
        <View style={styles.container}>
            <View style={[styles.badgeContainer, { backgroundColor: badge.bgColor }]}>
                <CustomText variant="caption" style={[styles.badgeText, { color: badge.textColor }]}>
                    {badge.label}
                </CustomText>
            </View>

            <CustomText variant="h1" style={styles.trailName}>
                {trail?.name || 'N/A'}
            </CustomText>

            <View style={styles.locationRow}>
                <CustomIcon 
                    library="Feather" 
                    name="map-pin" 
                    size={16} 
                    color={Colors.TEXT_SECONDARY} 
                />
                <CustomText variant="body" style={styles.locationText}>
                    {trail?.location || 'N/A'}
                </CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: Colors.BACKGROUND,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    badgeText: {
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    trailName: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 38,
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        color: Colors.TEXT_SECONDARY,
    },
});

export default HeroHeader;