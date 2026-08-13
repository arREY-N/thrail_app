import { Stack } from "expo-router";
import React, { useEffect, useState } from 'react';

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useLeaderboard } from "@/src/core/models/Leaderboard/hooks/useLeaderboard";
import { RankedUsers } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";
import LeaderboardScreen from "@/src/features/Community/screens/Leaderboard/LeaderboardScreen";
import { LeaderboardMetric } from "@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs";
import { useLeaderboardView } from "@/src/features/Community/screens/Leaderboard/hooks/useLeaderboardView";
// import { SAMPLE_RANKINGS_DATA, CURRENT_USER_STANDING } from "@/src/features/Community/screens/Leaderboard/constants/LeaderboardDummyData";

/**
 * Controller page for the Leaderboard route.
 * Handles navigation hooks, metric filter state, and passes live data to LeaderboardScreen.
 */
export default function leaderboard(): React.JSX.Element {
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

    // DUMMY DATA FOR UI TESTING (Comment this block out when live)
    // const isLoading = false;
    // let baseRankings: RankedUsers<Date>[] = [...SAMPLE_RANKINGS_DATA];
    
    // if (profile) {
    //     const foundUser = baseRankings.find(u => u.userId === activeUserId || u.username === activeUsername);
    //     if (!foundUser) {
    //         baseRankings.push({
    //             rank: 7,
    //             userId: profile.id || 'u999',
    //             username: profile.username || 'You',
    //             firstname: profile.firstname || '',
    //             lastname: profile.lastname || '',
    //             email: profile.email || '',
    //             profileImage: null,
    //             totalDistance: 20.5,
    //             totalElevation: 800,
    //             totalHikes: 2,
    //             hikingRecords: []
    //         });
    //     }
    // } else {
    //     baseRankings.push(CURRENT_USER_STANDING);
    // }
    
    // const { 
    //     currentUserData, 
    //     topThree, 
    //     restOfList, 
    //     currentMonthStr, 
    //     nextMonthStr 
    // } = useLeaderboardView({
    //     userRankings: baseRankings, 
    //     activeMetric, 
    //     activeUserId, 
    //     activeUsername, 
    //     profile
    // });

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
