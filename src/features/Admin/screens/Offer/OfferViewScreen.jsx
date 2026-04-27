import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const OfferViewScreen = ({ 
    offerId,
    offer, 
    bookings, 
    onViewBooking, 
    onBackPress, 
    error 
}) => {
    
    if (!offer) return null;

    const trailName = offer.trail?.name || 'Unnamed Trail';

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Offer Details" 
                centerTitle={true} 
                onBackPress={onBackPress} 
            />
            
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.constrainer}>
                    
                    <View style={styles.offerSummaryCard}>
                        
                        <View style={styles.headerRow}>
                            <View style={styles.headerTitleGroup}>
                                <CustomText variant="label" style={styles.trailLabel}>
                                    TRAIL OFFER
                                </CustomText>
                                <CustomText variant="h2" style={styles.trailName}>
                                    {trailName}
                                </CustomText>
                            </View>
                            <View style={styles.priceGroup}>
                                <CustomText variant="h3" style={styles.priceText}>
                                    ₱{offer.price}
                                </CustomText>
                                <CustomText style={styles.priceSubText}>
                                    / person
                                </CustomText>
                            </View>
                        </View>

                        <View style={styles.chipRow}>
                            {(offer.date || offer.hikeDate) && (
                                <View style={styles.infoChip}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="calendar" 
                                        size={14} 
                                        color={Colors.TEXT_SECONDARY} 
                                    />
                                    <CustomText style={styles.chipText}>
                                        {formatDate(offer.date || offer.hikeDate)}
                                    </CustomText>
                                </View>
                            )}
                            
                            {(offer.duration || offer.hikeDuration) && (
                                <View style={styles.infoChip}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="clock" 
                                        size={14} 
                                        color={Colors.TEXT_SECONDARY} 
                                    />
                                    <CustomText style={styles.chipText}>
                                        {offer.duration || offer.hikeDuration}
                                    </CustomText>
                                </View>
                            )}

                            {(offer.minPax || offer.maxPax) && (
                                <View style={styles.infoChip}>
                                    <CustomIcon 
                                        library="Feather" 
                                        name="users" 
                                        size={14} 
                                        color={Colors.TEXT_SECONDARY} 
                                    />
                                    <CustomText style={styles.chipText}>
                                        {offer.minPax || 0} - {offer.maxPax || 0} Pax
                                    </CustomText>
                                </View>
                            )}
                        </View>

                        {offer.description && (
                            <CustomText variant="caption" style={styles.descText} numberOfLines={2}>
                                {offer.description}
                            </CustomText>
                        )}
                    </View>

                    <CustomText variant="h3" style={styles.sectionTitle}>
                        Recent Bookings ({bookings?.length || 0})
                    </CustomText>

                    {error && (
                        <CustomText style={styles.errorText}>
                            {error}
                        </CustomText>
                    )}

                    {bookings && bookings.length > 0 ? (
                        bookings.map(b => {
                            const isPending = b.status === 'pending-docs' || b.status === 'for-reservation';
                            const isRejected = b.status === 'reservation-rejected';
                            
                            let statusColor = Colors.TEXT_SECONDARY;
                            let bgColor = Colors.GRAY_ULTRALIGHT;

                            if (isPending) {
                                statusColor = Colors.STATUS_PENDING_TEXT;
                                bgColor = Colors.STATUS_PENDING_BG;
                            } else if (isRejected) {
                                statusColor = Colors.ERROR;
                                bgColor = Colors.ERROR_BG;
                            } else {
                                statusColor = Colors.SUCCESS;
                                bgColor = Colors.STATUS_APPROVED_BG;
                            }

                            const firstName = b.user?.firstname || 'Unknown';
                            const lastName = b.user?.lastname || 'Hiker';
                            const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

                            return (
                                <TouchableOpacity 
                                    key={b.id} 
                                    style={[
                                        styles.bookingCard, 
                                        isPending && styles.highlightBorder
                                    ]}
                                    onPress={() => onViewBooking(b.id, offerId)}
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
                                                {formatBookingDate(b.createdAt)}
                                            </CustomText>
                                        </View>
                                    </View>
                                    
                                    <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                                        <CustomText variant="caption" style={[styles.badgeText, { color: statusColor }]}>
                                            {isPending ? "NEEDS REVIEW" : (b.status || 'unknown').toUpperCase().replace('-', ' ')}
                                        </CustomText>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={styles.emptyState}>
                            <CustomIcon 
                                library="Feather" 
                                name="inbox" 
                                size={40} 
                                color={Colors.GRAY_MEDIUM} 
                            />
                            <CustomText variant="caption" style={styles.emptyText}>
                                No bookings found.
                            </CustomText>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40 
    },
    constrainer: {
        width: '100%',
        maxWidth: 768, 
        alignSelf: 'center',
    },
    offerSummaryCard: { 
        backgroundColor: Colors.WHITE, 
        padding: 20, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
        marginBottom: 24 
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    headerTitleGroup: {
        flex: 1,
        paddingRight: 16
    },
    trailLabel: { 
        color: Colors.PRIMARY, 
        letterSpacing: 1, 
        marginBottom: 4, 
        fontSize: 11 
    },
    trailName: { 
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY
    },
    priceGroup: {
        alignItems: 'flex-end'
    },
    priceText: { 
        fontWeight: 'bold', 
        color: Colors.SUCCESS,
        marginBottom: 2
    },
    priceSubText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 6
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY
    },
    descText: { 
        color: Colors.TEXT_SECONDARY, 
        lineHeight: 20 
    },
    sectionTitle: { 
        marginBottom: 16, 
        fontWeight: 'bold', 
        marginLeft: 4 
    },
    errorText: { 
        color: Colors.ERROR, 
        marginBottom: 16, 
        marginLeft: 4 
    },
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
    },
    emptyState: { 
        padding: 40, 
        alignItems: 'center', 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT 
    },
    emptyText: { 
        marginTop: 8, 
        color: Colors.TEXT_SECONDARY 
    }
});

export default OfferViewScreen;