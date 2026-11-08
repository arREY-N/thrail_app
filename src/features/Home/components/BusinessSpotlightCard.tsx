/**
 * @file BusinessSpotlightCard.tsx
 * @description Adaptive spotlight component for featuring verified tour organizer partners on the Home screen.
 * Displays a full-width featured card when one business exists and seamlessly adapts to a horizontal carousel
 * if multiple businesses exist.
 */

import React, { useRef } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Business } from '@/src/core/models/Business/Business';
import { IOffer } from '@/src/core/models/Offer/Offer';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';
import { getInitials } from '@/src/utils/dateFormatter';
import { isAliveOffer } from '@/src/utils/offerHelpers';

/**
 * Props for the BusinessSpotlightCard component.
 *
 * @param businesses - List of active tour businesses.
 * @param offers - List of hike offers used to calculate active upcoming packages count.
 * @param onBusinessPress - Callback when a business card or "View Profile" CTA is pressed.
 * @param cardWidth - Optional custom card width for carousel view.
 */
interface Props {
    businesses?: Business[];
    offers?: IOffer[];
    onBusinessPress: (businessId: string) => void;
    cardWidth?: number;
}

/**
 * BusinessSpotlightCard — Adaptive spotlight card or carousel displaying verified tour organizers.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the featured tour partner card or carousel
 */
const BusinessSpotlightCard = ({
    businesses = [],
    offers = [],
    onBusinessPress,
    cardWidth,
}: Props): React.JSX.Element | null => {
    const scrollRef = useRef<ScrollView>(null);
    const hasMultiple = Boolean(businesses && businesses.length > 1);
    useWebDragScroll(scrollRef, hasMultiple, businesses);

    if (!businesses || businesses.length === 0) {
        return null;
    }

    // Helper to calculate active upcoming package count for a given business
    const getActivePackageCount = (business: Business): number => {
        return offers.filter((o) => {
            if (!isAliveOffer(o)) return false;
            if (o.business?.id && business.id) {
                return o.business.id.trim() === business.id.trim();
            }
            if (o.business?.name && business.name) {
                return o.business.name.trim().toLowerCase() === business.name.trim().toLowerCase();
            }
            return false;
        }).length;
    };

    // Helper to count real verified permits on file
    const getVerifiedPermitsCount = (business: Business): number => {
        return [
            business.permits?.denr,
            business.permits?.dti,
            business.permits?.bir,
        ].filter(Boolean).length;
    };

    // Helper to format established year and experience
    const formatEstablishedText = (date?: Date): string => {
        if (!date) return 'Registered Local Partner';
        try {
            const year = date instanceof Date ? date.getFullYear() : new Date(date).getFullYear();
            const currentYear = new Date().getFullYear();
            const diff = Math.max(0, currentYear - year);
            return diff > 0 ? `Guiding since ${year} • ${diff}+ yrs` : `Guiding since ${year}`;
        } catch {
            return 'Registered Local Partner';
        }
    };

    // Single Business: Render prominent, full-width featured card
    if (businesses.length === 1) {
        const business = businesses[0];
        const packageCount = getActivePackageCount(business);
        const permitsCount = getVerifiedPermitsCount(business);
        const establishedText = formatEstablishedText(business.establishedOn);
        const serviced = business.servicedLocation || [];
        const visibleLocations = serviced.slice(0, 3);
        const extraLocationsCount = Math.max(0, serviced.length - 3);
        const initials = getInitials(business.name);

        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <CustomText variant="subtitle" style={styles.sectionTitle}>
                        Featured Tour Partner
                    </CustomText>
                </View>

                <View style={styles.cardWrapper}>
                    <TouchableOpacity
                        style={styles.spotlightCard}
                        activeOpacity={0.85}
                        onPress={() => onBusinessPress(business.id)}
                    >
                        {/* Organizer Identity Row */}
                        <View style={styles.identityRow}>
                            <View style={styles.avatarContainer}>
                                <CustomText style={styles.avatarInitials}>
                                    {initials}
                                </CustomText>
                            </View>

                            <View style={styles.identityTextGroup}>
                                <View style={styles.nameBadgeRow}>
                                    <CustomText
                                        variant="h3"
                                        style={styles.businessName}
                                        numberOfLines={1}
                                    >
                                        {business.name}
                                    </CustomText>

                                    {permitsCount > 0 && (
                                        <View style={styles.verifiedBadge}>
                                            <CustomIcon
                                                library="Feather"
                                                name="check-circle"
                                                size={11}
                                                color={Colors.SUCCESS}
                                            />
                                            <CustomText
                                                variant="caption"
                                                style={styles.verifiedBadgeText}
                                            >
                                                Verified
                                            </CustomText>
                                        </View>
                                    )}
                                </View>

                                <CustomText
                                    variant="caption"
                                    style={styles.experienceSubtitle}
                                    numberOfLines={1}
                                >
                                    {business.address
                                        ? `${establishedText} • ${business.address}`
                                        : establishedText}
                                </CustomText>
                            </View>
                        </View>

                        {/* Coverage Tags */}
                        {visibleLocations.length > 0 && (
                            <View style={styles.coverageRow}>
                                <CustomText variant="caption" style={styles.coverageLabel}>
                                    Coverage:
                                </CustomText>
                                <View style={styles.tagCloud}>
                                    {visibleLocations.map((loc, idx) => (
                                        <View key={`${loc}-${idx}`} style={styles.tagChip}>
                                            <CustomText variant="caption" style={styles.tagChipText}>
                                                {loc}
                                            </CustomText>
                                        </View>
                                    ))}
                                    {extraLocationsCount > 0 && (
                                        <View style={styles.extraTagChip}>
                                            <CustomText variant="caption" style={styles.extraTagText}>
                                                {`+${extraLocationsCount} more`}
                                            </CustomText>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* Bottom Row with Colored Text CTA */}
                        <View style={styles.footerRow}>
                            <View style={styles.packageCountGroup}>
                                <CustomIcon
                                    library="Feather"
                                    name="compass"
                                    size={14}
                                    color={Colors.PRIMARY}
                                />
                                <CustomText variant="caption" style={styles.packageCountText}>
                                    {`${packageCount} Active ${packageCount === 1 ? 'Package' : 'Packages'}${permitsCount > 0 ? ` • ${permitsCount}/3 Permits` : ''}`}
                                </CustomText>
                            </View>

                            <View style={styles.viewProfileLink}>
                                <CustomText variant="caption" style={styles.viewProfileText}>
                                    View Profile
                                </CustomText>
                                <CustomIcon
                                    library="Feather"
                                    name="arrow-right"
                                    size={14}
                                    color={Colors.PRIMARY}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Multiple Businesses: Render horizontal carousel
    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <CustomText variant="subtitle" style={styles.sectionTitle}>
                    Featured Tour Partners
                </CustomText>
            </View>

            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                style={styles.scrollViewStyle}
            >
                {businesses.map((business) => {
                    const packageCount = getActivePackageCount(business);
                    const permitsCount = getVerifiedPermitsCount(business);
                    const establishedText = formatEstablishedText(business.establishedOn);
                    const initials = getInitials(business.name);

                    return (
                        <TouchableOpacity
                            key={business.id}
                            style={[
                                styles.spotlightCard,
                                styles.carouselCard,
                                Boolean(cardWidth) && { width: cardWidth },
                            ]}
                            activeOpacity={0.85}
                            onPress={() => onBusinessPress(business.id)}
                        >
                            <View style={styles.identityRow}>
                                <View style={styles.avatarContainer}>
                                    <CustomText style={styles.avatarInitials}>
                                        {initials}
                                    </CustomText>
                                </View>

                                <View style={styles.identityTextGroup}>
                                    <View style={styles.nameBadgeRow}>
                                        <CustomText
                                            variant="h3"
                                            style={styles.businessName}
                                            numberOfLines={1}
                                        >
                                            {business.name}
                                        </CustomText>

                                        {permitsCount > 0 && (
                                            <View style={styles.verifiedBadge}>
                                                <CustomIcon
                                                    library="Feather"
                                                    name="check-circle"
                                                    size={11}
                                                    color={Colors.SUCCESS}
                                                />
                                                <CustomText
                                                    variant="caption"
                                                    style={styles.verifiedBadgeText}
                                                >
                                                    Verified
                                                </CustomText>
                                            </View>
                                        )}
                                    </View>

                                    <CustomText
                                        variant="caption"
                                        style={styles.experienceSubtitle}
                                        numberOfLines={1}
                                    >
                                        {establishedText}
                                    </CustomText>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.footerRow}>
                                <CustomText variant="caption" style={styles.packageCountText}>
                                    {`${packageCount} Active ${packageCount === 1 ? 'Package' : 'Packages'}`}
                                </CustomText>

                                <View style={styles.viewProfileLink}>
                                    <CustomText variant="caption" style={styles.viewProfileText}>
                                        View Profile
                                    </CustomText>
                                    <CustomIcon
                                        library="Feather"
                                        name="arrow-right"
                                        size={13}
                                        color={Colors.PRIMARY}
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 0,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        marginBottom: 8,
    },
    cardWrapper: {
        paddingHorizontal: 16,
    },
    spotlightCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(3),
    },
    carouselCard: {
        width: 320,
        marginRight: 16,
    },
    horizontalList: {
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    scrollViewStyle: {
        width: '100%',
        ...Platform.select({
            web: {
                paddingBottom: 4,
                marginBottom: -4,
            },
        }),
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        flexShrink: 0,
    },
    avatarInitials: {
        color: Colors.WHITE,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.8,
    },
    identityTextGroup: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        gap: 2,
    },
    nameBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    businessName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
        flexShrink: 1,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    verifiedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    experienceSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    coverageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    coverageLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    tagCloud: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
    },
    tagChip: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    tagChipText: {
        fontSize: 11,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    extraTagChip: {
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    extraTagText: {
        fontSize: 11,
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 14,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageCountGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        marginRight: 12,
    },
    packageCountText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    viewProfileLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewProfileText: {
        color: Colors.PRIMARY,
        fontSize: 13,
        fontWeight: 'bold',
    },
});

export default BusinessSpotlightCard;
