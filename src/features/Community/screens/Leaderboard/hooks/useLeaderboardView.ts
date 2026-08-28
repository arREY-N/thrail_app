import { RankedUsers } from '@/src/core/models/Leaderboard/Leaderboard';
import { IUser } from '@/src/core/models/User/User';
import { LeaderboardMetric } from '@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs';
import { useMemo } from 'react';

/**
 * Parameters for the useLeaderboardView hook.
 * 
 * @param userRankings - The raw array of ranked users fetched from the backend or dummy data.
 * @param activeMetric - The currently selected metric (distance, elevation, hikes) to sort by.
 * @param activeUserId - The ID of the currently logged-in user.
 * @param activeUsername - The username of the currently logged-in user (fallback for matching).
 * @param profile - The currently logged-in user's profile data (used for fallback if user is unranked).
 */
interface UseLeaderboardViewParams {
    userRankings: RankedUsers<Date>[];
    activeMetric: LeaderboardMetric;
    activeUserId?: string;
    activeUsername?: string;
    profile?: Partial<IUser> | null;
}

/**
 * Custom hook to process leaderboard data for the UI.
 * 
 * This hook is responsible for:
 * 1. Finding the current user's standing in the leaderboard.
 * 2. Sorting the entire list based on the active metric filter.
 * 3. Re-assigning ranks after sorting (1 to N).
 * 4. Slicing the sorted list into `topThree` and `restOfList` (up to Top 10).
 * 5. Generating formatted date strings for the monthly banner.
 * 
 * @param params - Configuration object for leaderboard processing.
 * @returns Processed leaderboard data ready for UI rendering.
 */
export const useLeaderboardView = ({
    userRankings,
    activeMetric,
    activeUserId,
    activeUsername,
    profile,
}: UseLeaderboardViewParams) => {
    // 1. Find Current User Data
    const currentUserData = useMemo(() => {
        const found = userRankings.find(
            (u) => (activeUserId && u.userId === activeUserId) || (activeUsername && u.username === activeUsername)
        );

        return found || {
            userId: activeUserId || 'unranked-user',
            username: activeUsername || 'Unknown',
            firstname: profile?.firstname || '',
            lastname: profile?.lastname || '',
            email: profile?.email || '',
            profileImage: null,
            rank: 0,
            totalDistance: 0,
            totalElevation: 0,
            totalHikes: 0,
            hikingRecords: []
        };
    }, [userRankings, activeUserId, activeUsername, profile]);

    // 2. Sort and Process Rankings
    const { topThree, restOfList } = useMemo(() => {
        const sortedRankings = [...userRankings].sort((a, b) => {
            if (activeMetric === 'distance') return b.totalDistance - a.totalDistance;
            if (activeMetric === 'elevation') return b.totalElevation - a.totalElevation;
            return b.totalHikes - a.totalHikes;
        });

        const reRanked = sortedRankings.map((user, idx) => ({
            ...user,
            rank: idx + 1,
        }));

        const topTen = reRanked.slice(0, 10);

        return {
            topThree: topTen.slice(0, 3),
            restOfList: topTen.slice(3)
        };
    }, [userRankings, activeMetric]);

    // 3. Date Formatting
    const { currentMonthStr, nextMonthStr } = useMemo(() => {
        const now = new Date();
        const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = nextMonthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return { currentMonthStr: currentMonth, nextMonthStr: nextMonth };
    }, []);

    return {
        currentUserData,
        topThree,
        restOfList,
        currentMonthStr,
        nextMonthStr
    };
};
