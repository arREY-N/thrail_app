/**
 * @file BusinessSpotlightCard.tsx
 * @description Scenic hero spotlight component for featuring verified tour organizer partners on the Home screen.
 * Uses Banner.jpg with a dark LinearGradient overlay, floating status pills, and a clean bottom-left
 * title + metadata stack (matching TrailOfTheMonthCard) across both Mobile and Web.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    ImageSourcePropType,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors, Palette } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Business } from '@/src/core/models/Business/Business';
import { IOffer } from '@/src/core/models/Offer/Offer';
import { Review } from '@/src/core/models/Review/Review';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useWebDragScroll } from '@/src/hooks/useWebDragScroll';
import { isAliveOffer } from '@/src/utils/offerHelpers';

const BANNER_IMAGE_SOURCE: ImageSourcePropType = require('@/src/assets/images/Banner.jpg');

/**
 * Props for the BusinessSpotlightCard component.
 *
 * @param businesses - List of active tour businesses.
 * @param offers - List of hike offers used to calculate active upcoming packages count.
 * @param reviews - Optional list of community reviews used to calculate the business rating.
 * @param onBusinessPress - Callback when a business spotlight card is pressed.
 * @param cardWidth - Optional custom card width for carousel view.
 */
interface Props {
    businesses?: Business[];
    offers?: IOffer[];
    reviews?: Review[];
    onBusinessPress: (businessId: string) => void;
    cardWidth?: number;
}

/**
 * BusinessSpotlightCard — Scenic hero spotlight card or carousel displaying verified tour organizers.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the featured tour partner card or carousel
 */
const BusinessSpotlightCard = ({
    businesses = [],
    offers = [],
    reviews = [],
    onBusinessPress,
    cardWidth,
}: Props): React.JSX.Element | null => {
    const scrollRef = useRef<ScrollView>(null);
    const { isDesktop, isTablet } = useBreakpoints();
    const isWide = isDesktop || isTablet;

    const hasMultiple = Boolean(businesses && businesses.length > 1);
    useWebDragScroll(scrollRef, hasMultiple, businesses);

    if (!businesses || businesses.length === 0) {
        return null;
    }

    /**
     * Calculates active upcoming package count for a given business.
     *
     * @param business - Target business entity.
     * @returns Number of active upcoming offers.
     */
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

    /**
     * Formats established year and years of guiding experience.
     *
     * @param date - Date the business was established.
     * @returns Human-readable established string.
     */
    const formatEstablishedText = (date?: Date): string => {
        if (!date) return 'Registered Tour Partner';
        try {
            const year = date instanceof Date ? date.getFullYear() : new Date(date).getFullYear();
            const currentYear = new Date().getFullYear();
            const diff = Math.max(0, currentYear - year);
            return diff > 0 ? `Est. ${year} (${diff}+ yrs)` : `Est. ${year}`;
        } catch {
            return 'Registered Tour Partner';
        }
    };

    const renderSpotlightBanner = (business: Business, isCarouselItem: boolean): React.JSX.Element => {
        const packageCount = getActivePackageCount(business);
        const establishedText = formatEstablishedText(business.establishedOn);
        const rating = business.rating ?? 0;
        const reviewsCount = business.reviewCount ?? 0;
        const ratingLabel = reviewsCount > 0
            ? `${rating.toFixed(1)} (${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'})`
            : 'New Partner';

        return (
            <TouchableOpacity
                key={business.id}
                style={[
                    styles.fullCard,
                    isCarouselItem && styles.carouselCard,
                    Boolean(isCarouselItem && cardWidth) && { width: cardWidth },
                ]}
                activeOpacity={0.88}
                onPress={() => onBusinessPress(business.id)}
            >
                <View style={[styles.imageContainer, isWide && styles.imageContainerWide]}>
                    <CustomImage
                        source={BANNER_IMAGE_SOURCE}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />

                    <LinearGradient
                        colors={['rgba(0, 0, 0, 0.12)', 'rgba(0, 0, 0, 0.38)', `${Colors.BLACK}E6`]}
                        style={[styles.gradientOverlay, isWide && styles.gradientOverlayWide]}
                    >
                        {/* Top Floating Badges Row */}
                        <View style={styles.topBadgeRow}>
                            <View style={styles.featuredBadge}>
                                <CustomIcon
                                    library="AntDesign"
                                    name="star"
                                    size={12}
                                    color={Colors.YELLOW}
                                />
                                <CustomText style={styles.featuredBadgeText}>
                                    Featured Tour Partner
                                </CustomText>
                            </View>

                            <View style={styles.packagePill}>
                                <CustomIcon
                                    library="Feather"
                                    name="compass"
                                    size={12}
                                    color={Colors.WHITE}
                                />
                                <CustomText style={styles.packagePillText}>
                                    {`${packageCount} Active ${packageCount === 1 ? 'Package' : 'Packages'}`}
                                </CustomText>
                            </View>
                        </View>

                        {/* Bottom-Left Content Stack (Flush Left, Matching TrailOfTheMonthCard) */}
                        <View style={styles.contentContainer}>
                            <View style={styles.nameBadgeRow}>
                                <CustomText
                                    variant="body"
                                    style={[
                                        styles.businessName,
                                        isWide && styles.businessNameWide,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {business.name}
                                </CustomText>

                                <View style={styles.verifiedBadge}>
                                    <CustomIcon
                                        library="Feather"
                                        name="check-circle"
                                        size={11}
                                        color={Colors.WHITE}
                                    />
                                    <CustomText style={styles.verifiedBadgeText}>
                                        Verified
                                    </CustomText>
                                </View>
                            </View>

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <CustomIcon
                                        library="AntDesign"
                                        name="star"
                                        size={12}
                                        color={Colors.YELLOW}
                                    />
                                    <CustomText variant="caption" style={styles.metaText}>
                                        {ratingLabel}
                                    </CustomText>
                                </View>

                                {Boolean(business.address) && (
                                    <View style={styles.metaItem}>
                                        <CustomIcon
                                            library="Feather"
                                            name="map-pin"
                                            size={12}
                                            color={Colors.YELLOW}
                                        />
                                        <CustomText
                                            variant="caption"
                                            style={styles.metaText}
                                            numberOfLines={1}
                                        >
                                            {business.address}
                                        </CustomText>
                                    </View>
                                )}

                                <View style={styles.metaItem}>
                                    <CustomIcon
                                        library="Feather"
                                        name="calendar"
                                        size={12}
                                        color={Colors.YELLOW}
                                    />
                                    <CustomText
                                        variant="caption"
                                        style={styles.metaText}
                                        numberOfLines={1}
                                    >
                                        {establishedText}
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        );
    };

    if (businesses.length === 1) {
        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <CustomText variant="subtitle" style={styles.sectionTitle}>
                        Featured Tour Partner
                    </CustomText>
                </View>

                <View style={styles.cardWrapper}>
                    {renderSpotlightBanner(businesses[0], false)}
                </View>
            </View>
        );
    }

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
                {businesses.map((business) => renderSpotlightBanner(business, true))}
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
        marginBottom: 4,
    },
    cardWrapper: {
        paddingHorizontal: 16,
    },
    fullCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        overflow: 'hidden',
        ...GlobalStyles.dropShadow(3),
        marginVertical: 4,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    carouselCard: {
        width: 340,
        marginRight: 16,
    },
    horizontalList: {
        paddingTop: 8,
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
    imageContainer: {
        height: 210,
        width: '100%',
        position: 'relative',
        backgroundColor: Colors.GRAY_LIGHT,
        borderRadius: 16,
        overflow: 'hidden',
    },
    imageContainerWide: {
        height: 230,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.GRAY_LIGHT,
    },
    gradientOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        justifyContent: 'space-between',
        padding: 16,
    },
    gradientOverlayWide: {
        padding: 20,
    },
    topBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap',
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    featuredBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Palette.Slate900,
    },
    packagePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: Palette.Green600,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    packagePillText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.WHITE,
    },
    contentContainer: {
        width: '100%',
        gap: 6,
    },
    nameBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    businessName: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_INVERSE,
        lineHeight: 30,
        letterSpacing: 0.2,
        flexShrink: 1,
        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: `0px 1px 4px ${Colors.BLACK}80`,
            },
        }),
    },
    businessNameWide: {
        fontSize: 26,
        lineHeight: 32,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Palette.Green600,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    verifiedBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.WHITE,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: 14,
        rowGap: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.TEXT_INVERSE,
        ...Platform.select({
            ios: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            android: {
                textShadowColor: Colors.SHADOW,
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
            },
            web: {
                textShadow: `0px 1px 4px ${Colors.BLACK}80`,
            },
        }),
    },
});

export default BusinessSpotlightCard;
