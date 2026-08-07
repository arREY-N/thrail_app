import { Stack } from "expo-router";
import React, { useEffect, useState } from 'react';

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useLeaderboard } from "@/src/core/models/Leaderboard/hooks/useLeaderboard";
import { RankedUsers } from "@/src/core/models/Leaderboard/interfaces/ILeaderboard";
import LeaderboardScreen from "@/src/features/Community/screens/Leaderboard/LeaderboardScreen";
import { LeaderboardMetric } from "@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs";

/**
 * DATA MODE SWITCH:
 * Set `USE_DUMMY_DATA = true` to test UI with backend-conforming sample data,
 * or `USE_DUMMY_DATA = false` to switch strictly to live Firestore data fetching.
 */
const USE_DUMMY_DATA = false;

/**
 * Controller page for the Leaderboard route.
 * Handles navigation hooks, metric filter state, and passes live data to LeaderboardScreen.
 * 
 * @returns {React.JSX.Element} Rendered Leaderboard page.
 */
export default function leaderboard(): React.JSX.Element {
    const { onBackPress } = useAppNavigation();
    const { profile } = useAuthHook();

    const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('distance');

    const {
        leaderboard: backendLeaderboard,
        isLoading,
        getMonthLeaderboard
    } = useLeaderboard();

    useEffect(() => {
        if (!USE_DUMMY_DATA) {
            getMonthLeaderboard(new Date());
        }
    }, []);

    const userRankings: RankedUsers<Date>[] = USE_DUMMY_DATA
        ? SAMPLE_RANKINGS_DATA
        : (backendLeaderboard?.userRankings ?? []);

    const activeUserId = profile?.id;
    const activeUsername = profile?.username;

    let currentUserData: RankedUsers<Date> | undefined = userRankings.find(
        (u) => (activeUserId && u.userId === activeUserId) || (activeUsername && u.username === activeUsername)
    );

    if (!currentUserData && profile) {
        currentUserData = {
            rank: 0,
            userId: profile.id,
            username: profile.username || 'You',
            firstname: profile.firstname || '',
            lastname: profile.lastname || '',
            email: profile.email || '',
            profileImage: profile.profileImage || null,
            totalDistance: 0,
            totalElevation: 0,
            totalHikes: 0,
            hikingRecords: [],
        };
    } else if (!currentUserData) {
        currentUserData = CURRENT_USER_STANDING;
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <LeaderboardScreen
                userRankings={userRankings}
                currentUserData={currentUserData}
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                onBackPress={onBackPress}
                isLoading={isLoading}
            />
        </>
    );
}

// Dummy data for testing the UI without backend integration
const CURRENT_USER_STANDING: RankedUsers<Date> = {
    rank: 42,
    userId: 'u101',
    username: 'username@1',
    firstname: 'Emmanuel',
    lastname: 'User',
    email: 'emmanuel@example.com',
    profileImage: null,
    totalDistance: 18.5,
    totalElevation: 620,
    totalHikes: 3,
    hikingRecords: [
        { hikeId: 'hk-101', distance: 8.5, elevation: 310, hikeDate: new Date('2026-06-02') },
        { hikeId: 'hk-102', distance: 10.0, elevation: 310, hikeDate: new Date('2026-06-15') },
    ],
};

const SAMPLE_RANKINGS_DATA: RankedUsers<Date>[] = [
    {
        rank: 1,
        userId: 'u1',
        username: 'MountainKing',
        firstname: 'Marco',
        lastname: 'Reyes',
        email: 'marco@example.com',
        profileImage: null,
        totalDistance: 45.2,
        totalElevation: 1850,
        totalHikes: 8,
        hikingRecords: [
            { hikeId: 'hk-01', distance: 14.2, elevation: 650, hikeDate: new Date('2026-06-01') },
            { hikeId: 'hk-02', distance: 16.0, elevation: 700, hikeDate: new Date('2026-06-10') },
            { hikeId: 'hk-03', distance: 15.0, elevation: 500, hikeDate: new Date('2026-06-20') },
        ],
    },
    {
        rank: 2,
        userId: 'u2',
        username: 'TrailBlazer_99',
        firstname: 'Bea',
        lastname: 'Santos',
        email: 'bea@example.com',
        profileImage: null,
        totalDistance: 38.8,
        totalElevation: 1420,
        totalHikes: 6,
        hikingRecords: [
            { hikeId: 'hk-04', distance: 12.8, elevation: 450, hikeDate: new Date('2026-06-05') },
            { hikeId: 'hk-05', distance: 13.0, elevation: 520, hikeDate: new Date('2026-06-14') },
            { hikeId: 'hk-06', distance: 13.0, elevation: 450, hikeDate: new Date('2026-06-22') },
        ],
    },
    {
        rank: 3,
        userId: 'u3',
        username: 'SkyWalker',
        firstname: 'Carlos',
        lastname: 'Mendoza',
        email: 'carlos@example.com',
        profileImage: null,
        totalDistance: 32.4,
        totalElevation: 1280,
        totalHikes: 5,
        hikingRecords: [
            { hikeId: 'hk-07', distance: 10.4, elevation: 400, hikeDate: new Date('2026-06-03') },
            { hikeId: 'hk-08', distance: 11.0, elevation: 430, hikeDate: new Date('2026-06-12') },
            { hikeId: 'hk-09', distance: 11.0, elevation: 450, hikeDate: new Date('2026-06-25') },
        ],
    },
    {
        rank: 4,
        userId: 'u4',
        username: 'ForestRanger',
        firstname: 'Daniel',
        lastname: 'Cruz',
        email: 'daniel@example.com',
        profileImage: null,
        totalDistance: 28.4,
        totalElevation: 1100,
        totalHikes: 5,
        hikingRecords: [],
    },
    {
        rank: 5,
        userId: 'u5',
        username: 'EchoHiker',
        firstname: 'Elena',
        lastname: 'Garcia',
        email: 'elena@example.com',
        profileImage: null,
        totalDistance: 24.1,
        totalElevation: 950,
        totalHikes: 4,
        hikingRecords: [],
    },
    {
        rank: 6,
        userId: 'u6',
        username: 'SummitSeeker',
        firstname: 'Felix',
        lastname: 'Torres',
        email: 'felix@example.com',
        profileImage: null,
        totalDistance: 22.0,
        totalElevation: 880,
        totalHikes: 4,
        hikingRecords: [],
    },
    {
        rank: 7,
        userId: 'u7',
        username: 'CanyonCrawler',
        firstname: 'Grace',
        lastname: 'Ramos',
        email: 'grace@example.com',
        profileImage: null,
        totalDistance: 19.8,
        totalElevation: 750,
        totalHikes: 3,
        hikingRecords: [],
    },
    {
        rank: 8,
        userId: 'u8',
        username: 'RidgeRunner',
        firstname: 'Hannah',
        lastname: 'Dizon',
        email: 'hannah@example.com',
        profileImage: null,
        totalDistance: 17.5,
        totalElevation: 690,
        totalHikes: 3,
        hikingRecords: [],
    },
    {
        rank: 9,
        userId: 'u9',
        username: 'PeakPioneer',
        firstname: 'Ian',
        lastname: 'Lopez',
        email: 'ian@example.com',
        profileImage: null,
        totalDistance: 15.2,
        totalElevation: 600,
        totalHikes: 2,
        hikingRecords: [],
    },
    {
        rank: 10,
        userId: 'u10',
        username: 'TrailTracker',
        firstname: 'Jasmine',
        lastname: 'Reyes',
        email: 'jasmine@example.com',
        profileImage: null,
        totalDistance: 13.0,
        totalElevation: 520,
        totalHikes: 2,
        hikingRecords: [],
    },
    // {
    //     rank: 11,
    //     userId: 'u11',
    //     username: 'MountainExplorer',
    //     firstname: 'Kevin',
    //     lastname: 'Garcia',
    //     email: 'kevin@example.com',
    //     profileImage: null,
    //     totalDistance: 10.8,
    //     totalElevation: 450,
    //     totalHikes: 2,
    //     hikingRecords: [],
    // },
];