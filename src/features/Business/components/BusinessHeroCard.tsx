/**
 * @file BusinessHeroCard.tsx
 * @description Open identity banner component for the tour business profile screen,
 * styled after ProfileScreen's userBanner without an outer box container.
 * Displays organizer avatar initials, business name, verified badge, established year, address,
 * and concise real metric summary.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { Business } from '@/src/core/models/Business/Business';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Props for the BusinessHeroCard component.
 *
 * @param business - The tour business model data.
 * @param packageCount - Count of active upcoming packages/offers for this business.
 * @param guidesCount - Count of team members (owner + active coordinators).
 * @param permitsCount - Count of verified legal permits on file (max 3: DENR, DTI, BIR).
 * @param rating - Optional public review rating score.
 * @param reviewsCount - Optional total count of public reviews.
 */
interface Props {
    business: Business;
    packageCount: number;
    guidesCount: number;
    permitsCount: number;
    rating?: number;
    reviewsCount?: number;
}

/**
 * BusinessHeroCard — Open ProfileScreen-style organizer identity banner.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the identity banner
 */
const BusinessHeroCard = ({
    business,
    packageCount,
    guidesCount,
    permitsCount,
    rating = 4.9,
    reviewsCount = 60,
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
                ? `Est. ${year} (${diff}+ yrs)`
                : `Est. ${year}`;
        } catch {
            return 'Registered Tour Partner';
        }
    })();

    const subtitleLine = business.address
        ? `${establishedText} • ${business.address}`
        : establishedText;

    const metricsSummary = [
        `${packageCount} Active ${packageCount === 1 ? 'Package' : 'Packages'}`,
        `${permitsCount}/3 Permits`,
        `${guidesCount} ${guidesCount === 1 ? 'Member' : 'Members'}`,
    ].join('  •  ');

    return (
        <View style={styles.bannerContainer}>
            <View style={styles.infoLeft}>
                <View style={styles.avatarPlaceholder}>
                    <CustomText style={styles.initialsText}>
                        {initials}
                    </CustomText>
                </View>

                <View style={styles.identityTextGroup}>
                    <View style={styles.titleBadgeRow}>
                        <CustomText
                            variant="h2"
                            style={styles.businessNameText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
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

                    {rating !== undefined && (
                        <View style={styles.ratingRow}>
                            <CustomIcon
                                library="AntDesign"
                                name="star"
                                size={13}
                                color={Colors.YELLOW}
                            />
                            <CustomText variant="caption" style={styles.ratingText}>
                                {`${rating.toFixed(1)}${reviewsCount !== undefined ? ` (${reviewsCount} reviews)` : ''}`}
                            </CustomText>
                        </View>
                    )}

                    <CustomText
                        variant="caption"
                        style={styles.subtitleText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {subtitleLine}
                    </CustomText>

                    <CustomText
                        variant="caption"
                        style={styles.metricsSummaryText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {metricsSummary}
                    </CustomText>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
        minWidth: 0,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
        flexShrink: 0,
    },
    initialsText: {
        color: Colors.WHITE,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    identityTextGroup: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
        gap: 2,
    },
    titleBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    businessNameText: {
        marginBottom: 0,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: -0.5,
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
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 1,
        marginBottom: 1,
    },
    ratingText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: '600',
        fontSize: 12,
    },
    subtitleText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    metricsSummaryText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 12,
        marginTop: 2,
        fontWeight: '500',
    },
});

export default BusinessHeroCard;
