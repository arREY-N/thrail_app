import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const formatDate = (dateObj) => {
    if (!dateObj) return "TBA";
    const d = new Date(dateObj);
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${shortMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const OfferListScreen = ({ 
    offers,
    isLoading, 
    onAddOffer, 
    onEditOffer,
    onBackPress 
}) => {
    const safeOffers = offers || []; 

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Manage Offers" onBackPress={onBackPress} />

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <CustomButton 
                    title="+ Add New Offer"
                    onPress={() => onAddOffer()}
                    variant="primary"
                    style={styles.addButton}
                />

                {isLoading && (
                    <CustomText style={styles.loadingText}>Loading your offers...</CustomText>
                )}

                {!isLoading && safeOffers.length === 0 && (
                    <View style={styles.emptyState}>
                        <CustomIcon library="Feather" name="inbox" size={48} color={Colors.GRAY_MEDIUM} />
                        <CustomText variant="h3" style={styles.emptyTitle}>No Offers Yet</CustomText>
                        <CustomText variant="body" style={styles.emptySubtitle}>
                            Create your first hiking package to start receiving bookings.
                        </CustomText>
                    </View>
                )}

                {!isLoading && safeOffers.length > 0 && (
                    <View style={styles.listContainer}>
                        {safeOffers.map(offer => (
                            <View key={offer.id} style={styles.offerCard}>
                                
                                <View style={styles.cardHeader}>
                                    <View style={styles.trailInfo}>
                                        <CustomText variant="label" style={styles.trailLabel}>TRAIL</CustomText>
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
                                        <CustomText variant="caption" style={styles.detailText}>
                                            {formatDate(offer.date || offer.hikeDate)}
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

                                <CustomButton 
                                    title="Edit Offer"
                                    onPress={() => onEditOffer(offer.id)}
                                    variant="outline"
                                    style={styles.editButton}
                                />
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    addButton: {
        marginBottom: 20,
        shadowColor: Colors.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        color: Colors.TEXT_SECONDARY,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        color: Colors.TEXT_PRIMARY,
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    listContainer: {
        gap: 16,
    },
    offerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    trailInfo: {
        flex: 1,
        paddingRight: 12,
    },
    trailLabel: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 1,
        marginBottom: 2,
    },
    trailName: {
        fontSize: 18,
        color: Colors.TEXT_PRIMARY,
    },
    priceInfo: {
        alignItems: 'flex-end',
    },
    priceText: {
        color: Colors.PRIMARY,
        fontSize: 20,
    },
    perPax: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 10,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 12,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    detailText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    description: {
        color: Colors.TEXT_SECONDARY,
        lineHeight: 18,
        marginBottom: 16,
    },
    editButton: {
        paddingVertical: 10,
    },
});

export default OfferListScreen;