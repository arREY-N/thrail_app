import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';

export default function profile(){
    const   {
        onSettingsPress,
    } = useAppNavigation();

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

    const myReviews = reviews.filter(r => isOwned(r));

    let maxDist = 0; let maxDistTrail = '--';
    let maxTime = 0; let maxTimeTrail = '--';
    let maxElev = 0; let maxElevTrail = '--';

    myReviews.forEach(log => {
        const dist = parseFloat(log.distance || log.trail?.length) || 0;
        const time = parseFloat(log.duration || log.trail?.hours) || 0;
        const elev = parseFloat(log.elevation || log.trail?.masl) || 0;
        const trailName = log.trail?.name || log.trailName || '--';

        if (dist > maxDist) { maxDist = dist; maxDistTrail = trailName; }
        if (time > maxTime) { maxTime = time; maxTimeTrail = trailName; }
        if (elev > maxElev) { maxElev = elev; maxElevTrail = trailName; }
    });

    const totalHikesCount = myReviews.length;
    const lastHikeName = totalHikesCount > 0 ? (myReviews[0].trail?.name || myReviews[0].trailName || '--') : '--';

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

    return (
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
        />
    );
}