import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { formatDateToStandard } from '@/src/utils/dateFormatter';

const OfferCard = ({ offer, statusDetails, actionableCount, onViewBookings, onEditPress }) => {
    return (
        <View style={styles.offerCard}>
            
            <View style={styles.cardHeader}>
                <View style={styles.trailInfo}>
                    <View style={styles.labelRow}>
                        <CustomText variant="label" style={styles.trailLabel}>TRAIL</CustomText>
                        
                        {statusDetails.label !== 'Active' && (
                            <View style={[styles.statusBadge, { backgroundColor: statusDetails.bg }]}>
                                <CustomText style={[styles.statusBadgeText, { color: statusDetails.color }]}>
                                    {statusDetails.label}
                                </CustomText>
                            </View>
                        )}
                    </View>
                    <CustomText variant="h3" style={styles.trailName} numberOfLines={1}>
                        {offer.trail?.name || "Unknown Trail"}
                    </CustomText>
                </View>
                <View style={styles.priceInfo}>
                    <CustomText variant="title" style={styles.priceText}>
                        ₱{offer.price}
                    </CustomText>
                    <CustomText variant="caption" style={styles.perPax}>/ person</CustomText>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                    <CustomIcon library="Feather" name="calendar" size={14} color={Colors.TEXT_SECONDARY} />
                    <CustomText variant="caption" style={[
                        styles.detailText, 
                        statusDetails.label === 'Expired' && { color: Colors.ERROR }
                    ]}>
                        {formatDateToStandard(offer.date || offer.hikeDate)}
                    </CustomText>
                </View>
                
                <View style={styles.detailRow}>
                    <CustomIcon library="Feather" name="clock" size={14} color={Colors.TEXT_SECONDARY} />
                    <CustomText variant="caption" style={styles.detailText}>
                        {offer.duration || offer.hikeDuration || "1 Day"}
                    </CustomText>
                </View>

                <View style={styles.detailRow}>
                    <CustomIcon library="Feather" name="users" size={14} color={Colors.TEXT_SECONDARY} />
                    <CustomText variant="caption" style={styles.detailText}>
                        {offer.minPax} - {offer.maxPax} Pax
                    </CustomText>
                </View>
            </View>

            <CustomText variant="caption" style={styles.description} numberOfLines={2}>
                {offer.description}
            </CustomText>

            <View style={styles.actionButtonWrapper}>
                {actionableCount > 0 && (
                    <View style={styles.buttonNotificationDot}>
                        <CustomText style={styles.notificationText}>
                            {actionableCount > 99 ? '99+' : actionableCount}
                        </CustomText>
                    </View>
                )}
                <CustomButton 
                    title="Manage Bookings"
                    onPress={() => onViewBookings(offer.id)}
                    variant="primary"
                    style={styles.viewBookingsButton}
                />
            </View>

            <CustomButton 
                title="Edit Offer"
                onPress={() => onEditPress(offer.id)}
                variant="outline"
                style={styles.editButton}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    offerCard: { backgroundColor: Colors.WHITE, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    trailInfo: { flex: 1, paddingRight: 12 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 20 },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    statusBadgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    trailLabel: { color: Colors.PRIMARY, fontWeight: 'bold', fontSize: 12, letterSpacing: 2 },
    trailName: { fontSize: 18, color: Colors.TEXT_PRIMARY },
    priceInfo: { alignItems: 'flex-end', gap: 0 },
    priceText: { color: Colors.PRIMARY, fontSize: 20 },
    perPax: { color: Colors.TEXT_SECONDARY, marginTop: -4, fontSize: 12 },
    divider: { height: 1, backgroundColor: Colors.GRAY_ULTRALIGHT, marginVertical: 12 },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
    detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.BACKGROUND, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 6 },
    detailText: { color: Colors.TEXT_PRIMARY, fontWeight: '500' },
    description: { color: Colors.TEXT_SECONDARY, lineHeight: 18, marginBottom: 16 },
    actionButtonWrapper: { position: 'relative', marginBottom: 8 },
    buttonNotificationDot: { position: 'absolute', top: -8, right: -8, backgroundColor: Colors.ERROR, minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10, paddingHorizontal: 6, borderWidth: 2, borderColor: Colors.WHITE },
    notificationText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 11 },
    viewBookingsButton: { paddingVertical: 10 },
    editButton: { paddingVertical: 10 },
});

export default OfferCard;