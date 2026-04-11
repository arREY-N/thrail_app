import { Stack } from "expo-router";
import React from 'react';

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import LeaderboardScreen from "@/src/features/Community/screens/LeaderboardScreen";

export default function leaderboardRoute() {
    const {
        onBackPress
    } = useAppNavigation();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <LeaderboardScreen 
                leaderboardData={DUMMY_LEADERBOARD}
                currentUserData={CURRENT_USER_DUMMY}
                onBackPress={onBackPress} 
            />
        </>
    );
}

const CURRENT_USER_DUMMY = { 
    id: 'u1', 
    rank: 42, 
    username: 'username@1', 
    score: 3200, 
    trend: 'up' 
};

const DUMMY_LEADERBOARD = [
    { id: '1', rank: 1, username: 'MountainKing', score: 15420, trend: 'up' },
    { id: '2', rank: 2, username: 'TrailBlazer_99', score: 14200, trend: 'same' },
    { id: '3', rank: 3, username: 'SkyWalker', score: 13850, trend: 'up' },
    { id: '4', rank: 4, username: 'ForestRanger', score: 12100, trend: 'down' },
    { id: '5', rank: 5, username: 'EchoHiker', score: 11900, trend: 'up' },
    { id: '6', rank: 6, username: 'SummitSeeker', score: 10500, trend: 'same' },
    { id: '7', rank: 7, username: 'CanyonCrawler', score: 9800, trend: 'down' },
    { id: '8', rank: 8, username: 'RidgeRunner', score: 9200, trend: 'up' },
    { id: '9', rank: 9, username: 'PeakMaster', score: 8900, trend: 'down' },
    { id: '10', rank: 10, username: 'ValleyVagabond', score: 8500, trend: 'same' },
];