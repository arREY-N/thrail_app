import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const BookingOverviewCard = ({ booking }) => {
    const formattedDate = formatBookingDate(booking?.offer?.date);

    return (
        <View style={styles.card}>
            <CustomText variant="h2" style={styles.trailName}>
                {booking?.trail?.name || 'Trail Name'}
            </CustomText>
            <CustomText variant="caption" style={styles.guideName}>
                Guided by {booking?.business?.name || 'Guide Name'}
            </CustomText>
            
            <View style={styles.divider} />

            <View style={styles.dataRow}>
                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                    Date & Time
                </CustomText>
                <CustomText variant="body" style={styles.value}>
                    {formattedDate}
                </CustomText>
            </View>

            <View style={styles.dataRow}>
                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                    Hiker
                </CustomText>
                <CustomText variant="body" style={styles.value}>
                    {booking?.user?.firstname} {booking?.user?.lastname}
                </CustomText>
            </View>

            <View style={styles.dataRow}>
                <CustomText variant="caption" color={Colors.TEXT_SECONDARY}>
                    Booking ID
                </CustomText>
                <CustomText variant="body" style={styles.value}>
                    {booking?.id || 'N/A'}
                </CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
        marginBottom: 16,
    },
    trailName: { 
        color: Colors.PRIMARY, 
        marginBottom: 4, 
        fontWeight: 'bold',
    },
    guideName: { 
        color: Colors.TEXT_SECONDARY,
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        marginVertical: 16,
    },
    dataRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12,
    },
    value: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        textAlign: 'right', 
        flex: 1, 
        marginLeft: 20,
    },
});

export default BookingOverviewCard;