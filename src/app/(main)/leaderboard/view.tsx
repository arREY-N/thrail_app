import { Stack } from "expo-router";
import React, { useEffect, useState } from 'react';

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { RankedUsers, useLeaderboard } from "@/src/core/models/Leaderboard/Leaderboard";
import { useAuthHook } from "@/src/core/models/User/User";
import LeaderboardScreen from "@/src/features/Community/screens/Leaderboard/LeaderboardScreen";
import { LeaderboardMetric } from "@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs";
import { useLeaderboardView } from "@/src/features/Community/screens/Leaderboard/hooks/useLeaderboardView";

/**
 * Controller page for the Leaderboard route.
 * Handles navigation hooks, metric filter state, and passes live data to LeaderboardScreen.
 */
export default function Leaderboard(): React.JSX.Element {
    const { onBackPress } = useAppNavigation();
    const { profile } = useAuthHook();

    const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('distance');

    const activeUserId = profile?.id;
    const activeUsername = profile?.username;

    // TODO: Uncomment when the data have to fetch
    const {
        leaderboard: backendLeaderboard,
        isLoading,
        getMonthLeaderboard
    } = useLeaderboard();

    useEffect(() => {
        getMonthLeaderboard(new Date());
    }, []);

    const userRankings: RankedUsers<Date>[] = backendLeaderboard?.userRankings ?? [];

    const {
        currentUserData,
        topThree,
        restOfList,
        currentMonthStr,
        nextMonthStr
    } = useLeaderboardView({
        userRankings,
        activeMetric,
        activeUserId,
        activeUsername,
        profile
    });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <LeaderboardScreen
                topThree={topThree}
                restOfList={restOfList}
                currentUserData={currentUserData}
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                onBackPress={onBackPress}
                isLoading={isLoading}
                currentMonthStr={currentMonthStr}
                nextMonthStr={nextMonthStr}
            />
        </>
    );
}
