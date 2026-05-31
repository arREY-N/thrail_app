import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { useEmergencyContact } from '@/src/core/hook/user/useEmergencyContact';

export default function profile(){
    const {
        onSettingsPress,
        onGroupPress
    } = useAppNavigation();

    const {
        findUser,
        setEmergencyContact,
    } = useEmergencyContact();

    // useEffect(() => {
    //     const fetch = async () => {
    //         console.log('findUser function from useEmergencyContact hook:');
    //         const found = await findUser('emman90@sample.com');

    //         await setEmergencyContact({
    //             userId: found[0].id,
    //             name: `${found[0].firstname} ${found[0].lastname}`,
    //             contactNumber: found[0].phoneNumber,
    //             email: found[0].email,
    //         }, found[0]);
    //     }

    //     fetch();
    // },[])

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
        const dist = parseFloat(log.distance) || 0;
        const time = parseFloat(log.duration) || 0;
        const elev = parseFloat(log.elevation) || 0;
        const trailName = log.trail?.name || log.trailName || '--';

        if (dist > maxDist) { maxDist = dist; maxDistTrail = trailName; }
        if (time > maxTime) { maxTime = time; maxTimeTrail = trailName; }
        if (elev > maxElev) { maxElev = elev; maxElevTrail = trailName; }
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
        highestPoint: { value: maxElev > 0 ? `${Math.round(maxElev)} m` : '--', trail: maxElevTrail },
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
            onGroupPress={onGroupPress}
        />
    );
}