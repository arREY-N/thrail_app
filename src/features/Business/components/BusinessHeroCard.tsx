/**
 * @file BusinessHeroCard.tsx
 * @description Recommendation-style scenic hero cover banner and 4-column key specs bar
 * for the Tour Business profile screen. Uses Banner.jpg with a LinearGradient overlay,
 * floating glass pills, and dynamically calculated review metrics.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    DimensionValue,
    ImageSourcePropType,
    Platform,
    StyleSheet,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Business } from '@/src/core/models/Business/Business';
import { getInitials } from '@/src/utils/dateFormatter';

const BANNER_IMAGE_SOURCE: ImageSourcePropType = require('@/src/assets/images/Banner.jpg');

/**
 * Props for the BusinessHeroCard component.
 *
 * @param business - The tour business model data.
 * @param packageCount - Count of active upcoming offers for this business.
 * @param guidesCount - Count of team members (owner + active coordinators).
 * @param permitsCount - Count of verified legal permits on file (max 3: DENR, DTI, BIR).
 * @param rating - Dynamically calculated review rating score.
 * @param reviewsCount - Dynamically calculated total count of business reviews.
 * @param contentMaxWidth - Responsive max-width token for aligning overlay content and specs card.
 */
interface Props {
    business: Business;
    packageCount: number;
    guidesCount: number;
    permitsCount?: number;
    rating?: number;
    reviewsCount?: number;
    contentMaxWidth?: DimensionValue;
}

/**
 * BusinessHeroCard — Recommendation-style scenic cover banner and 3-column key specs card.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the hero cover banner and key specs bar
 */
const BusinessHeroCard = ({
    business,
    packageCount,
    guidesCount,
    rating = 0,
    reviewsCount = 0,
    contentMaxWidth = '100%',
}: Props): React.JSX.Element => {
    const initials = getInitials(business.name);

    const establishedText = (() => {
        if (!business.establishedOn) return 'Registered Tour Partner';
        try {
            const year = business.establishedOn instanceof Date
                ? business.establishedOn.getFullYear()
                : new Date(business.establishedOn).getFullYear();
            const currentYear = new Date().getFullYear();
            const diff = Math.max(0, currentYear - year);
            return diff > 0
                ? `Est. ${year}`
                : `Est. ${year}`;
        } catch {
            return 'Registered Tour Partner';
        }
    })();

    const hasReviews = reviewsCount > 0 && rating > 0;
    const specsRatingLabel = hasReviews
        ? `${rating.toFixed(1)} (${reviewsCount})`
        : 'N/A (0)';

    return (
        <View style={styles.heroWrapper}>
            {/* 1. Full-Width Scenic Cover Banner (Matching Recommendation Screen) */}
            <View style={styles.imageContainer}>
                <CustomImage
                    source={BANNER_IMAGE_SOURCE}
                    style={styles.cardImage}
                    resizeMode="cover"
                />

                <LinearGradient
                    colors={['transparent', `${Colors.BLACK}40`, `${Colors.BLACK}E6`]}
                    style={styles.gradientOverlay}
                >
                    <View
                        style={[
                            styles.contentContainer,
                            {
                                maxWidth: contentMaxWidth,
                                alignSelf: 'center',
                                width: '100%',
                            },
                        ]}
                    >
                        {/* Main Organizer Identity Row */}
                        <View style={styles.identityRow}>
                            <View style={styles.avatarCircle}>
                                <CustomText style={styles.initialsText}>
                                    {initials}
                                </CustomText>
                            </View>

                            <View style={styles.identityTextGroup}>
                                <View style={styles.nameBadgeRow}>
                                    <CustomText
                                        variant="body"
                                        style={styles.businessNameTitle}
                                        numberOfLines={2}
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

                                <View style={styles.heroMetaRow}>
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
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* 2. Key Specs Bar Below Banner (Matching Recommendation Screen specsCard) */}
            <View
                style={[
                    styles.specsContainer,
                    {
                        maxWidth: contentMaxWidth,
                        alignSelf: 'center',
                        width: '100%',
                    },
                ]}
            >
                <View style={styles.specsCard}>
                    <View style={styles.specItem}>
                        <CustomIcon
                            library="Feather"
                            name="compass"
                            size={16}
                            color={Colors.PRIMARY}
                        />
                        <CustomText style={styles.specItemLabel}>
                            Offers
                        </CustomText>
                        <CustomText style={styles.specItemVal}>
                            {`${packageCount} Active`}
                        </CustomText>
                    </View>

                    <View style={styles.specDivider} />

                    <View style={styles.specItem}>
                        <CustomIcon
                            library="Feather"
                            name="users"
                            size={16}
                            color={Colors.PRIMARY}
                        />
                        <CustomText style={styles.specItemLabel}>
                            Team
                        </CustomText>
                        <CustomText style={styles.specItemVal}>
                            {`${guidesCount} ${guidesCount === 1 ? 'Member' : 'Members'}`}
                        </CustomText>
                    </View>

                    <View style={styles.specDivider} />

                    <View style={styles.specItem}>
                        <CustomIcon
                            library="Feather"
                            name="star"
                            size={16}
                            color={Colors.PRIMARY}
                        />
                        <CustomText style={styles.specItemLabel}>
                            Rating
                        </CustomText>
                        <CustomText style={styles.specItemVal}>
                            {specsRatingLabel}
                        </CustomText>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    heroWrapper: {
        width: '100%',
        gap: 16,
    },
    imageContainer: {
        height: 260,
        width: '100%',
        position: 'relative',
        backgroundColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
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
        justifyContent: 'flex-end',
        padding: 16,
    },
    contentContainer: {
        gap: 8,
    },
    nameBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.PRIMARY,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    verifiedBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.WHITE,
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        flexShrink: 0,
    },
    initialsText: {
        color: Colors.WHITE,
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    identityTextGroup: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    businessNameTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.TEXT_INVERSE,
        textAlign: 'left',
        lineHeight: 30,
        letterSpacing: 0.2,
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
    heroMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
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
    specsContainer: {
        paddingHorizontal: 16,
    },
    specsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        elevation: 1,
        ...GlobalStyles.dropShadow(1, 0.05),
    },
    specItem: {
        flex: 1,
        alignItems: 'center',
        gap: 3,
    },
    specItemLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    specItemVal: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.TEXT_PRIMARY,
    },
    specDivider: {
        width: 1,
        height: 28,
        backgroundColor: Colors.GRAY_LIGHT,
    },
});

export default BusinessHeroCard;
