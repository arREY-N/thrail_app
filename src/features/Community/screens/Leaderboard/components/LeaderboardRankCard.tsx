/**
 * @file LeaderboardRankCard.tsx
 * @description Individual rank row card for hikers ranked #4 and below in the Leaderboard list.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { RankedUsers } from '@/src/core/models/Leaderboard/interfaces/ILeaderboard';
import { LeaderboardMetric } from '@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Interface representing the properties for LeaderboardRankCard.
 * 
 * @param user - Ranked user data
 * @param activeMetric - Active leaderboard metric selection
 */
interface LeaderboardRankCardProps {
    user: RankedUsers<Date>;
    activeMetric: LeaderboardMetric;
}

/**
 * Helper to format metric values into readable strings.
 * 
 * @param user - Ranked user data
 * @param metric - Active metric filter
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

/**
 * LeaderboardRankCard — Individual card row for hikers #4 and below.
 * 
 * @param props - LeaderboardRankCardProps
 * @returns {React.JSX.Element} The rendered rank card.
 */
const LeaderboardRankCard = ({
    user,
    activeMetric,
}: LeaderboardRankCardProps): React.JSX.Element => {
    const fullName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username;

    return (
        <View style={styles.card}>
            {/* Rank Number Badge */}
            <View style={styles.rankBox}>
                <CustomText variant="label" style={styles.rankText}>
                    #{user.rank}
                </CustomText>
            </View>

            {/* Avatar or Initials Bubble */}
            <View style={styles.avatarBox}>
                {user.profileImage ? (
                    <CustomImage
                        source={{ uri: user.profileImage }}
                        style={styles.avatarImage}
                    />
                ) : (
                    <View style={styles.avatarInitialsBox}>
                        <CustomText variant="caption" style={styles.avatarInitialsText}>
                            {getInitials(fullName)}
                        </CustomText>
                    </View>
                )}
            </View>

            {/* User Names */}
            <View style={styles.infoBox}>
                <CustomText variant="body" style={styles.usernameText} numberOfLines={1}>
                    {user.username}
                </CustomText>
                {fullName !== user.username && (
                    <CustomText variant="caption" style={styles.fullNameText} numberOfLines={1}>
                        {fullName}
                    </CustomText>
                )}
            </View>

            {/* Metric Value Pill */}
            <View style={styles.metricPill}>
                <CustomText variant="label" style={styles.metricValueText}>
                    {formatMetricValue(user, activeMetric)}
                </CustomText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    rankBox: {
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    rankText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 14,
    },
    avatarBox: {
        marginRight: 12,
    },
    avatarImage: {
        width: 42,
        height: 42,
        borderRadius: 21,
    },
    avatarInitialsBox: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    avatarInitialsText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    infoBox: {
        flex: 1,
    },
    usernameText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    fullNameText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
    },
    metricPill: {
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.CHIP_PRIMARY_BORDER,
    },
    metricValueText: {
        color: Colors.CHIP_PRIMARY_TEXT,
        fontWeight: 'bold',
        fontSize: 13,
    },
});

export default LeaderboardRankCard;
