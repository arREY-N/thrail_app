import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useReview from '@/src/core/hook/review/useReview';
import CommunityScreen from '@/src/features/Community/screens/CommunityScreen';


export default function community(){
    const {
        reviews,
        isLoading,
        onWriteReviewPress,
        isOwned,
        likeReview,
        isLiked,
        refreshFeed
    } = useReview();

    const {
        onGroupPress,
        onNotificationPress,
        onBookingPress
    } = useAppNavigation();

    return (
        <CommunityScreen
            reviews={reviews}
            isLoading={isLoading}
            onWriteReviewPress={onWriteReviewPress}
            isOwned={isOwned}
            likeReview={likeReview}
            isLiked={isLiked}
            onRefresh={refreshFeed}
            onLeaderboardPress={() => {}} 
            onGroupPress={onGroupPress}
            onNotificationPress={onNotificationPress}
            onBookingPress={onBookingPress}
        />
    )
}