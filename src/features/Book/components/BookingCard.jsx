import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const getStatusConfig = (status) => {
    switch (status) {
        case 'completed':
            return { 
                label: 'Confirmed', 
                bgColor: Colors.STATUS_APPROVED_BG, 
                textColor: Colors.PRIMARY, 
                icon: 'check-circle' 
            };
        case 'paid':
            return { 
                label: 'Verifying', 
                bgColor: Colors.STATUS_PENDING_BG, 
                textColor: Colors.STATUS_PENDING_TEXT, 
                icon: 'clock' 
            };
        case 'approved-docs': 
        case 'for-payment':
            return { 
                label: 'Approved', 
                bgColor: Colors.STATUS_APPROVED_BG, 
                textColor: Colors.STATUS_APPROVED_TEXT, 
                icon: 'check-circle' 
            };
        case 'for-reservation':
        case 'pending-docs': 
        case 'for-reschedule':
        case 'reschedule-rejected':
        case 'rescheduled':
            return { 
                label: 'Pending', 
                bgColor: Colors.STATUS_PENDING_BG,  
                textColor: Colors.STATUS_PENDING_TEXT, 
                icon: 'clock' 
            };
        case 'for-cancellation':
        case 'refund':
        case 'cancellation-rejected':
        case 'cancelled':
            return { 
                label: 'Cancelled', 
                bgColor: Colors.STATUS_CANCELLED_BG, 
                textColor: Colors.STATUS_CANCELLED_TEXT, 
                icon: 'x-circle' 
            };
        default:
            return { 
                label: status ? status.toUpperCase() : 'UNKNOWN', 
                bgColor: Colors.GRAY_ULTRALIGHT, 
                textColor: Colors.TEXT_SECONDARY, 
                icon: 'help-circle' 
            };
    }
};

const BookingCard = ({ 
    booking, 
    onSelectBooking 
}) => {
    const statusConfig = getStatusConfig(booking.status);
    
    const trailName = booking.trail?.name || 'Hiking Package';
    const businessName = booking.business?.name || 'Independent Guide';
    const formattedDate = formatBookingDate(booking.offer?.date, true);
    const price = booking.offer?.price || 0;

    return (
        <TouchableOpacity 
            style={styles.cardContainer}
            onPress={() => onSelectBooking(booking)}
            activeOpacity={0.7}
        >
            <View style={styles.topRow}>
                <CustomText variant="body" style={styles.trailName} numberOfLines={1}>
                    {trailName}
                </CustomText>
                
                <View style={[styles.statusPill, { backgroundColor: statusConfig.bgColor }]}>
                    <CustomIcon 
                        library="Feather" 
                        name={statusConfig.icon} 
                        size={12} 
                        color={statusConfig.textColor} 
                    />
                    <CustomText style={[styles.statusPillText, { color: statusConfig.textColor }]}>
                        {statusConfig.label}
                    </CustomText>
                </View>
            </View>

            <View style={styles.middleRow}>
                <View style={styles.infoWrapper}>
                    <CustomIcon library="Feather" name="user" size={14} color={Colors.TEXT_PLACEHOLDER} />
                    <CustomText variant="caption" style={styles.infoText} numberOfLines={1}>
                        {businessName}
                    </CustomText>
                </View>
                
                <View style={styles.infoWrapper}>
                    <CustomIcon library="Feather" name="calendar" size={14} color={Colors.TEXT_PLACEHOLDER} />
                    <CustomText variant="caption" style={styles.infoText}>
                        {formattedDate}
                    </CustomText>
                </View>
            </View>

            <View style={styles.dottedDivider} />

            <View style={styles.bottomRow}>
                <View>
                    <CustomText variant="caption" style={styles.priceLabel}>
                        Total Amount
                    </CustomText>
                    <CustomText variant="h2" style={styles.priceText}>
                        ₱{price.toFixed(2)}
                    </CustomText>
                </View>
                
                <View style={styles.viewDetailsContainer}>
                    <CustomText style={styles.viewDetailsText}>
                        View Details
                    </CustomText>
                    <CustomIcon 
                        library="Feather" 
                        name="chevron-right" 
                        size={16} 
                        color={Colors.PRIMARY} 
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    trailName: {
        flex: 1,
        color: Colors.TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: 'bold',
        paddingRight: 12,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    middleRow: {
        gap: 8,
        marginBottom: 4,
    },
    infoWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 13,
    },
    dottedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        borderStyle: 'dashed',
        marginVertical: 16,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceLabel: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 11,
        marginBottom: 2,
    },
    priceText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginBottom: 0, 
    },
    viewDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingBottom: 4, 
    },
    viewDetailsText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default BookingCard;