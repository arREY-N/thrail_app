/**
 * @file MountainPodium.tsx
 * @description Mountain Peak Podium component visualizing the top 3 leaderboard hikers as mountain peaks with rank badges and metric indicators.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { RankedUsers } from '@/src/core/models/Leaderboard/Leaderboard';
import { LeaderboardMetric } from '@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Interface representing the properties for MountainPodium.
 * 
 * @param topThree - Array of top 3 ranked users from the backend
 * @param activeMetric - Active leaderboard metric selection
 * @param onSelectUser - Handler invoked when a top 3 mountain peak is tapped
 */
interface MountainPodiumProps {
    topThree: RankedUsers<Date>[];
    activeMetric: LeaderboardMetric;
    onSelectUser: (user: RankedUsers<Date>) => void;
}

/**
 * Helper to format metric display string based on current selected tab.
 * 
 * @param user - Ranked user data
 * @param metric - Currently selected leaderboard metric
 * @returns {string} Formatted metric string
 */
const formatMetricValue = (user: RankedUsers<Date>, metric: LeaderboardMetric): string => {
    if (metric === 'distance') {
        return `${user.totalDistance.toFixed(1)} km`;
    }
    if (metric === 'elevation') {
        return `${user.totalElevation.toLocaleString()} m`;
    }
    return `${user.totalHikes} ${user.totalHikes === 1 ? 'hike' : 'hikes'}`;
};

export const MOUNTAIN_ICON_CONFIG = {
    library: 'MaterialCommunityIcons' as const,
    name: 'image-filter-hdr' as const,
    // library: 'FontAwesome5' as const,
    // name: 'mountain' as const,
    // library: 'FontAwesome6' as const,
    // name: 'mountain-sun' as const,
    // library: 'Ionicons' as const,
    // name: 'triangle' as const,
};

/**
 * MountainPodium — Renders the top 3 hikers on clean pedestal pillars with mountain icons.
 * 
 * @param props - MountainPodiumProps
 * @returns {React.JSX.Element} The rendered mountain podium.
 */
const MountainPodium = ({
    topThree = [],
    activeMetric,
    onSelectUser,
}: MountainPodiumProps): React.JSX.Element => {
    const rank1 = topThree.find((u) => u.rank === 1);
    const rank2 = topThree.find((u) => u.rank === 2);
    const rank3 = topThree.find((u) => u.rank === 3);

    /**
     * Renders an individual mountain peak pedestal pillar.
     */
    const renderPeakItem = (
        user: RankedUsers<Date> | undefined,
        rankPosition: number
    ): React.JSX.Element => {
        if (!user) {
            return <View style={styles.peakColumn} />;
        }

        const isFirst = rankPosition === 1;
        const badgeColor =
            rankPosition === 1
                ? Colors.LEADERBOARD_GOLD
                : rankPosition === 2
                ? Colors.LEADERBOARD_SILVER
                : Colors.LEADERBOARD_BRONZE;

        const badgeBg =
            rankPosition === 1
                ? Colors.LEADERBOARD_GOLD_BG
                : rankPosition === 2
                ? Colors.LEADERBOARD_SILVER_BG
                : Colors.LEADERBOARD_BRONZE_BG;

        const avatarSize = isFirst ? 68 : 56;
        const peakHeight = isFirst ? 130 : rankPosition === 2 ? 100 : 80;

        const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username;

        return (
            <TouchableOpacity
                style={[styles.peakColumn, isFirst && styles.centerPeakColumn]}
                onPress={() => onSelectUser(user)}
                activeOpacity={0.85}
            >
                {/* Crown Icon for Rank 1 Champion */}
                {isFirst && (
                    <View style={styles.crownContainer}>
                        <CustomIcon library="FontAwesome5" name="crown" size={20} color={Colors.LEADERBOARD_GOLD} />
                    </View>
                )}

                {/* Avatar with Rank Badge */}
                <View style={styles.avatarContainer}>
                    <View
                        style={[
                            styles.avatarRing,
                            {
                                borderColor: badgeColor,
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: avatarSize / 2,
                            },
                        ]}
                    >
                        {user.profileImage ? (
                            <CustomImage
                                source={{ uri: user.profileImage }}
                                style={{
                                    width: avatarSize - 6,
                                    height: avatarSize - 6,
                                    borderRadius: (avatarSize - 6) / 2,
                                }}
                            />
                        ) : (
                            <View
                                style={[
                                    styles.initialsAvatar,
                                    {
                                        width: avatarSize - 6,
                                        height: avatarSize - 6,
                                        borderRadius: (avatarSize - 6) / 2,
                                    },
                                ]}
                            >
                                <CustomText
                                    variant="h2"
                                    style={[styles.initialsText, isFirst && styles.initialsTextLarge]}
                                >
                                    {getInitials(fullName)}
                                </CustomText>
                            </View>
                        )}
                    </View>

                    {/* Rank Badge */}
                    <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
                        <CustomText variant="caption" style={styles.rankBadgeText}>
                            #{rankPosition}
                        </CustomText>
                    </View>
                </View>

                {/* User Info */}
                <CustomText variant="caption" style={styles.usernameText} numberOfLines={1}>
                    {user.username}
                </CustomText>
                <CustomText variant="label" style={[styles.metricText, { color: badgeColor }]}>
                    {formatMetricValue(user, activeMetric)}
                </CustomText>

                {/* Clean Metallic Pedestal Pillar */}
                <View
                    style={[
                        styles.pedestalPillar,
                        {
                            height: peakHeight,
                            backgroundColor: badgeBg,
                            borderColor: badgeColor,
                        },
                    ]}
                >
                    {/* Top Position Mountain Icon */}
                    <View style={styles.mountainIconWrapper}>
                        <CustomIcon
                            library={MOUNTAIN_ICON_CONFIG.library}
                            name={MOUNTAIN_ICON_CONFIG.name}
                            size={isFirst ? 32 : 24}
                            color={badgeColor}
                        />
                        <View style={[styles.pedestalBadge, { backgroundColor: badgeColor }]}>
                            <CustomText variant="caption" style={styles.pedestalBadgeText}>
                                PEAK #{rankPosition}
                            </CustomText>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.podiumRow}>
                {renderPeakItem(rank2, 2)}
                {renderPeakItem(rank1, 1)}
                {renderPeakItem(rank3, 3)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 0,
        backgroundColor: Colors.BACKGROUND,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    podiumRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    peakColumn: {
        flex: 1,
        alignItems: 'center',
    },
    centerPeakColumn: {
        zIndex: 10,
    },
    crownContainer: {
        marginBottom: 4,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 6,
    },
    avatarRing: {
        backgroundColor: Colors.WHITE,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        ...GlobalStyles.dropShadow(3),
    },
    initialsAvatar: {
        backgroundColor: Colors.WHITE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 0,
    },
    initialsTextLarge: {
        fontSize: 18,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -6,
        alignSelf: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.WHITE,
    },
    rankBadgeText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 10,
    },
    usernameText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
        textAlign: 'center',
    },
    metricText: {
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 8,
    },
    pedestalPillar: {
        width: '88%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderWidth: 1.5,
        borderBottomWidth: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 8,
        marginBottom: 0,
    },
    mountainIconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pedestalBadge: {
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    pedestalBadgeText: {
        color: Colors.WHITE,
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default MountainPodium;
