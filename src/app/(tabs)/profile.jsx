import { router } from 'expo-router';
import React from 'react';

import ProfileScreen from '@/src/features/Profile/screens/ProfileScreen';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useProfileNavigation } from '@/src/core/hook/navigation/useProfileNavigation';
import useReview from '@/src/core/hook/review/useReview';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { formatDate } from '@/src/core/utility/date';

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

    const {
        onGroupPress
    } = useAppNavigation();

    const myDummyReviews = profile ? [
        {
            id: 'dummy-my-1',
            user: { id: profile.id, username: profile.username, firstname: profile.firstname, lastname: profile.lastname }, // Updated structure
            createdAt: new Date('2026-03-05T08:00:00Z'),
            hikeDate: new Date('2026-03-05T08:00:00Z'),
            overallRating: 5.0,
            review: "Amazing clearing at the summit! The trail was well established and the view was breathtaking. Definitely coming back.",
            likes: [{ id: 'user1' }, { id: 'user2' }, { id: 'user3' }],
            trail: { id: 't1', name: 'Mt. Parawagan' },
            distance: 9.5, elevation: 472, duration: 4,
            image: [],
            isDummy: true
        },
        {
            id: 'dummy-my-2',
            user: { id: profile.id, username: profile.username, firstname: profile.firstname, lastname: profile.lastname }, // Updated structure
            createdAt: new Date('2026-02-20T06:30:00Z'),
            hikeDate: new Date('2026-02-20T06:30:00Z'),
            overallRating: 4.5,
            review: "Classic Batulao! The 'New Trail' is much steeper now. Make sure to bring enough water as there isn't much shade along the ridges.",
            likes: [{ id: 'user1' }, { id: 'user2' }],
            trail: { id: 't2', name: 'Mt. Batulao' },
            distance: 9, elevation: 811, duration: 5,
            image: [],
            isDummy: true
        }
    ] : [];

    const actualMyReviews = reviews.filter(r => isOwned(r));
    const allMyRawReviews = [...actualMyReviews, ...myDummyReviews];

    const mappedHikeLog = allMyRawReviews.map(r => {
        /** @type {any} */
        const trailData = r.trail || r.hike || {};
        
        return {
            id: r.id,
            userName: r.user?.firstname ? `${r.user.firstname} ${r.user.lastname}` : (r.user?.username || 'Hiker'),
            location: trailData.location || trailData.province?.[0] || 'Unknown Location',
            date: formatDate(r.hikeDate || r.createdAt),
            trailName: trailData.name || 'Unknown Trail',
            rating: r.overallRating || 0,
            distance: trailData.length || trailData.distance || '--',
            elevation: trailData.masl || trailData.elevation || '--',
            duration: trailData.hours || trailData.duration || '--',
            review: r.review,
            likes: r.likes,
            rawReview: r, 
            isDummy: r.isDummy || false
        };
    });

    let maxDist = 0; let maxDistTrail = '--';
    let maxTime = 0; let maxTimeTrail = '--';
    let maxElev = 0; let maxElevTrail = '--';

    mappedHikeLog.forEach(log => {
        const dist = parseFloat(log.distance) || 0;
        const time = parseFloat(log.duration) || 0;
        const elev = parseFloat(log.elevation) || 0;

        if (dist > maxDist) { maxDist = dist; maxDistTrail = log.trailName; }
        if (time > maxTime) { maxTime = time; maxTimeTrail = log.trailName; }
        if (elev > maxElev) { maxElev = elev; maxElevTrail = log.trailName; }
    });

    const totalHikesCount = mappedHikeLog.length;
    const lastHikeName = totalHikesCount > 0 ? mappedHikeLog[0].trailName : '--';

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

    const safeLikeReview = (rawItem) => {
        if (rawItem.isDummy) return;
        likeReview(rawItem);
    };

    const safeOnEditReview = (id) => {
        if (id.startsWith('dummy')) return;
        onWriteReviewPress(id);
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
            hikeLog={mappedHikeLog}
            profile={profile}
            role={role}
            onLikeReview={safeLikeReview}
            isLiked={(raw) => raw.isDummy ? false : isLiked(raw)}
            onEditReview={safeOnEditReview}
            onGroupPress={onGroupPress}
        />
    );
}