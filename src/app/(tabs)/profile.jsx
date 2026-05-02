import { router } from 'expo-router';
import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';

export default function profile(){
    const {
        profile,
        role,
        onSignOutPress,
    } = useAuthHook();

    const {
        onAdminPress,
        onSuperadminPress,
        onViewAccountPress,
        onApplyPress,
    } = useProfileNavigation();

    const {
        reviews,
        isOwned,
        likeReview,
        isLiked,
        onWriteReviewPress,
    } = useReview();

    let maxDist = 0; let maxDistTrail = '--';
    let maxTime = 0; let maxTimeTrail = '--';
    let maxElev = 0; let maxElevTrail = '--';

    reviews.forEach(log => {
        const dist = parseFloat(log.distance) || 0;
        const time = parseFloat(log.duration) || 0;
        const elev = parseFloat(log.elevation) || 0;

        if (dist > maxDist) { maxDist = dist; maxDistTrail = log.trailName; }
        if (time > maxTime) { maxTime = time; maxTimeTrail = log.trailName; }
        if (elev > maxElev) { maxElev = elev; maxElevTrail = log.trailName; }
    });

    const totalHikesCount = reviews.length;
    const lastHikeName = totalHikesCount > 0 ? reviews[0].trailName : '--';

    const computedStats = {
        longestDistance: { value: maxDist > 0 ? `${maxDist} km` : '--', trail: maxDistTrail },
        longestTime: { value: maxTime > 0 ? `${maxTime} hr` : '--', trail: maxTimeTrail },
        highestPoint: { value: maxElev > 0 ? `${maxElev} m` : '--', trail: maxElevTrail },
        totalHikes: { value: String(totalHikesCount), lastHike: lastHikeName },
        achievements: { 
            beginner: totalHikesCount >= 1,
            regular: totalHikesCount >= 5, 
            experienced: totalHikesCount >= 10 
        }
    };

    const onSettingsPress = () => {
        router.push('/(main)/settings');
    };

    return (
        <ProfileScreen
            onSignOutPress={onSignOutPress}
            onApplyPress={onApplyPress}
            onAdminPress={onAdminPress}
            onSettingsPress={onSettingsPress}
            onSuperadminPress={onSuperadminPress}
            stats={computedStats}
            hikeLog={reviews}
            profile={profile}
            role={role}
            onLikeReview={likeReview}
            isLiked={isLiked}
            onEditReview={onWriteReviewPress}
        />
    );
}