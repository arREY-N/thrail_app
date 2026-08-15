import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { getStatusConfig } from '@/src/constants/statusConfig';
import { formatBookingDate, getRecentUpdateText, safeParseDateString } from '@/src/utils/dateFormatter';

import { IBooking } from '@/src/core/models/Booking/Booking';

export interface BookingCardProps {
    booking: IBooking | null;
    onSelectBooking: (booking: IBooking) => void;
    role?: 'user' | 'admin' | 'superadmin' | 'business';
}

const BookingCard: React.FC<BookingCardProps> = ({ 
    booking, 
    onSelectBooking, 
    role = 'user' 
}) => {
    if (!booking) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateVal = booking?.offer?.date;
    const hikeDate = safeParseDateString(dateVal);
    const isPast = hikeDate.getTime() < today.getTime();

    let displayStatus = booking?.status;

    if (displayStatus === 'for-cancellation') {
        const payments = booking?.payment || [];
        const hasRefund = payments.some(p => p.status === 'refunded');
        if (hasRefund) {
            displayStatus = 'refund';
        }
    }

    const isDead = [
        'refund', 
        'cancellation-rejected', 
        'reschedule-rejected'
    ].includes(displayStatus || '');

    if (isPast && !isDead) {
        if (['completed', 'paid', 'rescheduled'].includes(displayStatus || '')) {
            displayStatus = 'finished'; 
        } else {
            displayStatus = 'reservation-rejected'; 
        }
    }

    const configRole = (role === 'admin' || role === 'superadmin') ? 'admin' : 'user';
    const statusConfig = getStatusConfig(displayStatus, configRole);

    let actionLabel = "View Details";
    let actionColor: string = Colors.PRIMARY;
    let actionIcon = "chevron-right";

    if (!isPast && !isDead) {
        if (['for-payment', 'approved-docs'].includes(displayStatus || '')) {
            actionLabel = "Pay Now";
            actionColor = Colors.SUCCESS; 
        } else if (displayStatus === 'reservation-rejected') {
            actionLabel = "Update Docs";
            actionColor = Colors.ERROR;
        } else if (displayStatus === 'downpayment') {
            actionLabel = "Pay Balance";
            actionColor = Colors.WARNING;
        }
    }

    const recentUpdateText = getRecentUpdateText(booking?.updatedAt, booking?.createdAt);
    const trailName = booking?.trail?.name || 'Hiking Package';
    const businessName = booking?.business?.name || 'Independent Guide';
    const formattedDate = formatBookingDate(booking?.offer?.date, undefined, true);
    const price = booking?.offer?.price || 0;

    return (
        <TouchableOpacity 
            style={styles.cardContainer}
            onPress={() => onSelectBooking(booking)}
            activeOpacity={0.7}
        >
            <View style={styles.topRow}>
                <CustomText 
                    variant="body" 
                    style={styles.trailName} 
                    numberOfLines={1}
                >
                    {trailName}
                </CustomText>
                
                <View 
                    style={[
                        styles.statusPill, 
                        { backgroundColor: statusConfig.bgColor }
                    ]}
                >
                    <CustomIcon 
                        library="Feather" 
                        name={statusConfig.icon} 
                        size={12} 
                        color={statusConfig.textColor} 
                    />
                    <CustomText 
                        style={[
                            styles.statusPillText, 
                            { color: statusConfig.textColor }
                        ]}
                    >
                        {statusConfig.label}
                    </CustomText>
                </View>
            </View>

            <View style={styles.middleRow}>
                <View style={styles.infoWrapper}>
                    <CustomIcon 
                        library="Feather" 
                        name="user" 
                        size={14} 
                        color={Colors.TEXT_PLACEHOLDER} 
                    />
                    <CustomText 
                        variant="caption" 
                        style={styles.infoText} 
                        numberOfLines={1}
                    >
                        {businessName}
                    </CustomText>
                </View>
                
                <View style={styles.infoWrapper}>
                    <CustomIcon 
                        library="Feather" 
                        name="calendar" 
                        size={14} 
                        color={Colors.TEXT_PLACEHOLDER} 
                    />
                    <CustomText variant="caption" style={styles.infoText}>
                        {formattedDate}
                    </CustomText>
                </View>
            </View>

            <View style={styles.dottedDivider} />

            <View style={styles.bottomRow}>
                {displayStatus === 'downpayment' ? (
                    <View style={styles.priceColumnContainer}>
                        <View style={styles.flexCol}>
                            <CustomText variant="caption" style={styles.dataLabel}>
                                Paid (50%)
                            </CustomText>
                            <CustomText 
                                variant="h2" 
                                style={[
                                    styles.dataValue, 
                                    { color: Colors.SUCCESS }
                                ]}
                            >
                                ₱{(price / 2).toFixed(2)}
                            </CustomText>
                        </View>
                        <View style={styles.flexCol}>
                            <CustomText variant="caption" style={styles.dataLabel}>
                                Balance
                            </CustomText>
                            <CustomText 
                                variant="h2" 
                                style={[
                                    styles.dataValue, 
                                    { color: Colors.WARNING }
                                ]}
                            >
                                ₱{(price / 2).toFixed(2)}
                            </CustomText>
                        </View>
                    </View>
                ) : (
                    <View style={styles.flexCol}>
                        <CustomText variant="caption" style={styles.dataLabel}>
                            Total Amount
                        </CustomText>
                        <CustomText variant="h2" style={styles.dataValue}>
                            ₱{price.toFixed(2)}
                        </CustomText>
                    </View>
                )}

                <View style={styles.actionCol}>
                    <CustomText variant="caption" style={styles.updateLabel}>
                        {recentUpdateText || ' '} 
                    </CustomText>
                    
                    <View style={styles.viewDetailsContainer}>
                        <CustomText 
                            style={[
                                styles.viewDetailsText, 
                                { color: actionColor }
                            ]}
                        >
                            {actionLabel}
                        </CustomText>
                        <CustomIcon 
                            library="Feather" 
                            name={actionIcon} 
                            size={16} 
                            color={actionColor} 
                        />
                    </View>
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
         
         
         
         
        ...GlobalStyles.dropShadow(3), 
    },
    topRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 12 
    },
    trailName: { 
        flex: 1, 
        color: Colors.TEXT_PRIMARY, 
        fontSize: 18, 
        fontWeight: 'bold', 
        paddingRight: 12 
    },
    statusPill: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 20, 
        gap: 4 
    },
    statusPillText: { 
        fontSize: 10, 
        fontWeight: 'bold', 
        letterSpacing: 0.5 
    },
    middleRow: { 
        gap: 8, 
        marginBottom: 4 
    },
    infoWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8 
    },
    infoText: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 13 
    },
    dottedDivider: { 
        height: 1, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        borderStyle: 'dashed', 
        marginVertical: 16 
    },
    bottomRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'stretch' 
    },
    priceColumnContainer: { 
        flexDirection: 'row', 
        gap: 16 
    },
    flexCol: { 
        justifyContent: 'space-between' 
    },
    actionCol: { 
        justifyContent: 'space-between', 
        alignItems: 'flex-end'
    },
    dataLabel: { 
        color: Colors.TEXT_PLACEHOLDER, 
        fontSize: 11, 
        marginBottom: 4 
    },
    updateLabel: { 
        color: Colors.TEXT_PLACEHOLDER, 
        fontSize: 11, 
        fontStyle: 'italic', 
        marginBottom: 4 
    },
    dataValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold', 
        marginBottom: 0 
    },
    viewDetailsContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 2, 
        marginBottom: 0
    },
    viewDetailsText: { 
        fontWeight: 'bold', 
        fontSize: 14 
    }
});

export default BookingCard;