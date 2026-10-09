/**
 * @file leaderboardFormatters.ts
 * @description Shared formatting helpers for leaderboard metrics (distance, elevation, hikes).
 */

import { RankedUsers } from '@/src/core/models/Leaderboard/Leaderboard';
import { LeaderboardMetric } from '@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs';

/**
 * Helper to format metric display strings across podium, rank cards, and sticky footer.
 * 
 * @param user - Ranked user data
 * @param metric - Currently active leaderboard metric filter
 * @returns {string} Formatted metric string
 */
export const formatMetricValue = (user: RankedUsers<Date>, metric: LeaderboardMetric): string => {
    if (user.rank === 0) {
        return '--';
    }
    if (metric === 'distance') {
        return `${(user.totalDistance ?? 0).toFixed(1)} km`;
    }
    if (metric === 'elevation') {
        return `${(user.totalElevation ?? 0).toLocaleString()} m`;
    }
    return `${user.totalHikes ?? 0} ${(user.totalHikes ?? 0) === 1 ? 'hike' : 'hikes'}`;
};
