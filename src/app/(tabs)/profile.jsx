import LoadingScreen from '@/src/app/loading';
import useHike from '@/src/core/hook/hike/useHike';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import useDeleteProfile from '@/src/core/hook/user/useDeleteProfile';
import useEditProfile from '@/src/core/hook/user/useEditProfile';
import { useLeaderboard } from '@/src/core/models/Leaderboard/hooks/useLeaderboard';
import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function profile(){
    const {
        onSettingsPress,
        onGroupPress
    } = useAppNavigation();

    const {
        profile,
        role,
        onSignOutPress,
    } = useAuthHook();

    const {
        hikes
    } = useHike();

    const {
        onAdminPress,
        onSuperadminPress,
        onViewAccountPress,
        onApplyPress,
    } = useProfileNavigation();

    const {
        editProfile
    } = useEditProfile();

    const {
        onDeleteProfile,
        isLoading,
    } = useDeleteProfile();

    const {
        isLoading: loadingLeaderboard,
        leaderboard,
        generateMonthlyLeaderboard, 
    } = useLeaderboard();

    const {
        reviews,
        isOwned,
        likeReview,
        isLiked,
        onWriteReviewPress,
    } = useReview();

    const myReviews = reviews.filter(r => isOwned(r));

    let maxDist = null; let maxDistTrail = '--';
    let maxTime = null; let maxTimeTrail = '--';
    let maxElev = null; let maxElevTrail = '--';

    hikes.forEach(log => {
        const dist = parseFloat(log.distance) || 0;
        const time = parseFloat(log.duration) || 0;
        const elev = parseFloat(log.elevation) || 0;
        const trailName = log.trail?.name || log.trailName || '--';

        if (dist && dist > maxDist) { maxDist = dist; maxDistTrail = trailName; }
        if (time && time > maxTime) { maxTime = time; maxTimeTrail = trailName; }
        if (elev && elev > maxElev) { maxElev = elev; maxElevTrail = trailName; }
    });

    const totalHikesCount = myReviews.length;
    const lastHikeName = totalHikesCount > 0 ? (myReviews[0].trail?.name || myReviews[0].trailName || '--') : '--';

    const formatTime = (ms) => {
        if (ms === 0) return '--';
        const totalMins = Math.floor(ms / 60000);
        if (totalMins < 1) return '< 1m';
        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDistance = (m) => {
        if (m === 0) return '--';
        return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
    };

    const computedStats = {
        longestDistance: { value: formatDistance(maxDist), trail: maxDistTrail },
        longestTime: { value: formatTime(maxTime), trail: maxTimeTrail },
        highestPoint: { value: maxElev !== null ? `${Math.round(maxElev)} m` : '--', trail: maxElevTrail },
        totalHikes: { value: String(totalHikesCount), lastHike: lastHikeName },
        achievements: { 
            beginner: totalHikesCount >= 5,
            regular: totalHikesCount >= 10, 
            experienced: totalHikesCount >= 15 
        }
    };

    if(loadingLeaderboard) return <LoadingScreen/>

    return (
        <>
            <TESTLEADERBOARD 
                generateMonthlyLeaderboard={generateMonthlyLeaderboard}
                leaderboard={leaderboard}
            />      

            <ProfileScreen
                onSignOutPress={onSignOutPress}
                onApplyPress={onApplyPress}
                onAdminPress={onAdminPress}
                onSettingsPress={onSettingsPress}
                onSuperadminPress={onSuperadminPress}
                stats={computedStats}
                hikeLog={myReviews}
                profile={profile}
                role={role}
                onLikeReview={likeReview}
                isLiked={isLiked}
                onEditReview={onWriteReviewPress}
                onGroupPress={onGroupPress}
            />
        </>
    );
}

const TESTLEADERBOARD = ({
    generateMonthlyLeaderboard,
    leaderboard,
}) => {
    return (
        <View>
            <Pressable onPress={() => generateMonthlyLeaderboard(new Date('2026-06-01'))}>
                    <Text>Test Generator for June</Text>
                </Pressable>
                <View style={{ height: 20 }} />
                <Pressable onPress={() => generateMonthlyLeaderboard(new Date('2026-07-01'))}>
                    <Text>Test Generator for July</Text>
                </Pressable>
                <View style={{ height: 20 }} />
                <Pressable onPress={() => generateMonthlyLeaderboard(new Date('2026-08-01'))}>
                    <Text>Test Generator for Now</Text>
                </Pressable>

                { leaderboard && (
                    <View style={{ marginTop: 20 }}>
                        <Text>Leaderboard for {leaderboard.date.toLocaleDateString('en-US', { month: 'short'})}</Text>
                        {leaderboard.userRankings.map((user, index) => (
                            <View key={user.userId} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                                <Text>{index + 1}. {user.username}</Text>
                                <Text>{user.totalDistance.toFixed(2)} m</Text>
                            </View>
                        ))}

                    </View>
                )}

        </View>
    );
}