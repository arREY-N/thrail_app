import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

const OfferSummaryCard = ({ offer, trailName }) => {
    if (!offer) return null;

    return (
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
                        <CustomIcon library="Feather" name="calendar" size={14} color={Colors.TEXT_SECONDARY} />
                        <CustomText style={styles.chipText}>{formatDate(offer.date || offer.hikeDate)}</CustomText>
                    </View>
                )}
                
                {(offer.duration || offer.hikeDuration) && (
                    <View style={styles.infoChip}>
                        <CustomIcon library="Feather" name="clock" size={14} color={Colors.TEXT_SECONDARY} />
                        <CustomText style={styles.chipText}>{offer.duration || offer.hikeDuration}</CustomText>
                    </View>
                )}

                {(offer.minPax || offer.maxPax) && (
                    <View style={styles.infoChip}>
                        <CustomIcon library="Feather" name="users" size={14} color={Colors.TEXT_SECONDARY} />
                        <CustomText style={styles.chipText}>{offer.minPax || 0} - {offer.maxPax || 0} Pax</CustomText>
                    </View>
                )}
            </View>

            {offer.description && (
                <CustomText variant="caption" style={styles.descText} numberOfLines={2}>
                    {offer.description}
                </CustomText>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    offerSummaryCard: { backgroundColor: Colors.WHITE, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.GRAY_LIGHT, marginBottom: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    headerTitleGroup: { flex: 1, paddingRight: 16 },
    trailLabel: { color: Colors.PRIMARY, letterSpacing: 1, marginBottom: 4, fontSize: 11 },
    trailName: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    priceGroup: { alignItems: 'flex-end' },
    priceText: { fontWeight: 'bold', color: Colors.SUCCESS, marginBottom: 2 },
    priceSubText: { fontSize: 12, color: Colors.TEXT_SECONDARY },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.GRAY_ULTRALIGHT, gap: 6 },
    chipText: { fontSize: 12, fontWeight: '600', color: Colors.TEXT_PRIMARY },
    descText: { color: Colors.TEXT_SECONDARY, lineHeight: 20 },
});

export default OfferSummaryCard;