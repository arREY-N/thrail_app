import { useMemo } from 'react';

import { RankedUsers } from '@/src/core/models/Leaderboard/Leaderboard';
import { User } from '@/src/core/models/User/User';
import { LeaderboardMetric } from '@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs';

/**
 * Parameters for the useLeaderboardView hook.
 * 
 * @param userRankings - The raw array of ranked users fetched from the backend or dummy data.
 * @param activeMetric - The currently selected metric (distance, elevation, hikes) to sort by.
 * @param activeUserId - The ID of the currently logged-in user.
 * @param activeUsername - The username of the currently logged-in user (fallback for matching).
 * @param profile - The currently logged-in user's profile data (used for fallback if user is unranked).
 */
export interface UseLeaderboardViewParams {
    userRankings: RankedUsers<Date>[];
    activeMetric: LeaderboardMetric;
    activeUserId?: string;
    activeUsername?: string;
    profile?: Partial<User> | null;
}

/**
 * Custom hook to process leaderboard data for the UI.
 * 
 * This hook is responsible for:
 * 1. Sorting the entire list based on the active metric filter.
 * 2. Re-assigning ranks after sorting (1 to N).
 * 3. Slicing the sorted list into `topThree` and `restOfList` (strictly Top 10).
 * 4. Finding the current user's standing across the entire list (or creating an unranked fallback).
 * 5. Generating formatted date strings localized to Philippine time (en-PH, Asia/Manila).
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
    // 1. Sort and Process Rankings Safely
    const { topThree, restOfList, reRanked } = useMemo(() => {
        const sortedRankings = [...userRankings].sort((a, b) => {
            const distA = a.totalDistance ?? 0;
            const distB = b.totalDistance ?? 0;
            const elevA = a.totalElevation ?? 0;
            const elevB = b.totalElevation ?? 0;
            const hikesA = a.totalHikes ?? 0;
            const hikesB = b.totalHikes ?? 0;

            if (activeMetric === 'distance') return distB - distA;
            if (activeMetric === 'elevation') return elevB - elevA;
            return hikesB - hikesA;
        });

        const reRankedList = sortedRankings.map((user, idx) => ({
            ...user,
            rank: idx + 1,
        }));

        const topTen = reRankedList.slice(0, 10);

        return {
            reRanked: reRankedList,
            topThree: topTen.slice(0, 3),
            restOfList: topTen.slice(3),
        };
    }, [userRankings, activeMetric]);

    // 2. Find Current User Standing Strictly from Real Ranked Data with Unranked Fallback
    const currentUserData = useMemo(() => {
        if (!activeUserId && !activeUsername && !profile) return undefined;

        const found = reRanked.find(
            (u) => (activeUserId && u.userId === activeUserId) || (activeUsername && u.username === activeUsername)
        );

        if (found) {
            return found;
        }

        // Logged-in user has no completed hikes for this monthly period (unranked)
        return {
            userId: activeUserId || profile?.id || 'unranked-user',
            username: activeUsername || profile?.username || 'You',
            firstname: profile?.firstname || '',
            lastname: profile?.lastname || '',
            email: profile?.email || '',
            profileImage: profile?.profileImage || null,
            rank: 0,
            totalDistance: 0,
            totalElevation: 0,
            totalHikes: 0,
            hikingRecords: [],
        };
    }, [reRanked, activeUserId, activeUsername, profile]);

    // 3. Date Formatting (Localized to Philippine en-PH and Asia/Manila)
    // Evaluates previous completed month rankings per monthly snapshot architecture (now.getMonth() - 1)
    const { currentMonthStr, nextMonthStr } = useMemo(() => {
        const now = new Date();
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const rankingMonth = prevMonthDate.toLocaleDateString('en-PH', {
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Manila',
        });
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = nextMonthDate.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'Asia/Manila',
        });
        return { currentMonthStr: rankingMonth, nextMonthStr: nextMonth };
    }, []);

    return {
        currentUserData,
        topThree,
        restOfList,
        currentMonthStr,
        nextMonthStr,
    };
};
