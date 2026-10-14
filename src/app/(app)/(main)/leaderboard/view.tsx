import { Stack } from "expo-router";
import React, { useEffect, useState } from 'react';

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { RankedUsers, useLeaderboard, useLeaderboardStore } from "@/src/core/models/Leaderboard/Leaderboard";
import { useAuthHook } from "@/src/core/models/User/User";
import LeaderboardScreen from "@/src/features/Community/screens/Leaderboard/LeaderboardScreen";
import { LeaderboardMetric } from "@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs";

/**
 * Controller page for the Leaderboard route.
 * Handles navigation hooks, metric filter state, and passes live data to LeaderboardScreen.
 */
export default function Leaderboard(): React.JSX.Element {
    const { 
        onBackPress,
        onSeeMoreOffersPress,
    } = useAppNavigation();
    const { profile } = useAuthHook();

    const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('distance');

    const activeUserId = profile?.id;
    const activeUsername = profile?.username;

    const {
        leaderboard: backendLeaderboard,
        isLoading,
        // getMonthLeaderboard
    } = useLeaderboard();

    useEffect(() => {
        // Fetch active leaderboard cycle once on mount (evaluates previous month's hike activity)
        useLeaderboardStore.getState().fetchLeaderboard(new Date());
    }, []);

    const userRankings: RankedUsers<Date>[] = backendLeaderboard?.userRankings ?? [];

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <LeaderboardScreen
                userRankings={userRankings}
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                onBackPress={onBackPress}
                onExplorePress={onSeeMoreOffersPress}
                isLoading={isLoading}
                activeUserId={activeUserId}
                activeUsername={activeUsername}
                profile={profile}
            />
        </>
    );
}
