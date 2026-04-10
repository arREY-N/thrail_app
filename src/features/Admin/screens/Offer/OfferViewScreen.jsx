import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { formatBookingDate } from '@/src/utils/dateFormatter';

const OfferViewScreen = ({ 
    offerId,
    offer, 
    bookings, 
    onViewBooking, 
    onBackPress, 
    error 
}) => {
    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Offer Details" centerTitle={true} onBackPress={onBackPress} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.offerSummaryCard}>
                    <CustomText variant="label" style={styles.trailLabel}>TRAIL OFFER</CustomText>
                    <CustomText variant="h2" style={styles.trailName}>{offer.name}</CustomText>
                    <CustomText variant="body" style={styles.priceText}>₱{offer.price} / pax</CustomText>
                    <CustomText variant="caption" style={styles.descText} numberOfLines={2}>
                        {offer.description}
                    </CustomText>
                </View>

                <CustomText variant="h3" style={styles.sectionTitle}>
                    Recent Bookings ({bookings?.length || 0})
                </CustomText>

                {error && <CustomText style={styles.errorText}>{error}</CustomText>}

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

                        return (
                            <TouchableOpacity 
                                key={b.id} 
                                style={[styles.bookingCard, isPending && styles.highlightBorder]}
                                onPress={() => onViewBooking(b.id, offerId)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.hikerInfo}>
                                    <View style={styles.avatar}>
                                        <CustomIcon library="Feather" name="user" size={16} color={Colors.WHITE} />
                                    </View>
                                    <View style={styles.hikerTextGroup}>
                                        <CustomText variant="label" style={styles.hikerName}>
                                            {b.user?.firstname} {b.user?.lastname}
                                        </CustomText>
                                        <CustomText variant="caption">
                                            {formatBookingDate(b.createdAt)}
                                        </CustomText>
                                    </View>
                                </View>
                                
                                <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                                    <CustomText variant="caption" style={[styles.badgeText, { color: statusColor }]}>
                                        {isPending ? "NEEDS REVIEW" : b.status.toUpperCase().replace('-', ' ')}
                                    </CustomText>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyState}>
                        <CustomIcon library="Feather" name="inbox" size={40} color={Colors.GRAY_MEDIUM} />
                        <CustomText variant="caption" style={styles.emptyText}>No bookings found.</CustomText>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { padding: 16, paddingBottom: 40 },
    offerSummaryCard: { backgroundColor: Colors.WHITE, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, marginBottom: 24 },
    trailLabel: { color: Colors.PRIMARY, letterSpacing: 1, marginBottom: 4, fontSize: 11 },
    trailName: { marginBottom: 4, fontWeight: 'bold' },
    priceText: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY, marginBottom: 8 },
    descText: { color: Colors.TEXT_SECONDARY, lineHeight: 20 },
    sectionTitle: { marginBottom: 16, fontWeight: 'bold', marginLeft: 4 },
    errorText: { color: Colors.ERROR, marginBottom: 16, marginLeft: 4 },
    bookingCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.WHITE, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, marginBottom: 12 },
    highlightBorder: { borderColor: Colors.PRIMARY, borderWidth: 1.5 },
    hikerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.PRIMARY, justifyContent: 'center', alignItems: 'center' },
    hikerTextGroup: { flex: 1 },
    hikerName: { fontSize: 15, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginLeft: 8 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    emptyState: { padding: 40, alignItems: 'center', backgroundColor: Colors.WHITE, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY_LIGHT },
    emptyText: { marginTop: 8, color: Colors.TEXT_SECONDARY }
});

export default OfferViewScreen;