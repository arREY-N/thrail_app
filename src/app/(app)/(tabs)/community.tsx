/**
 * @file community.tsx
 * @description Expo Router tab controller page for the Community feed. Coordinates reviews state hooks and global navigation triggers.
 */

import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useReview, useReviewList } from '@/src/core/models/Review/Review';
import CommunityScreen from '@/src/features/Community/screens/CommunityScreen';

/**
 * community tab router component - Arrowless layout composition matching Expo Router rules.
 * Pure lean controller passing domain hooks to the CommunityScreen.
 */
export default function Community() {
    const {
        onWriteReviewPress,
        likeReview,
        isLiked,
    } = useReview();

    const {
        reviews,
        reviewIsLoading,
        reviewError,
        refresh,
    } = useReviewList();

    const {
        onGroupPress,
        onNotificationPress,
        onBookingPress,
        onLeaderBoardPress,
    } = useAppNavigation();

    return (
        <CommunityScreen
            reviews={reviews}
            isLoading={reviewIsLoading}
            isError={Boolean(reviewError)}
            onRefresh={refresh}
            onWriteReviewPress={onWriteReviewPress}
            likeReview={likeReview}
            isLiked={isLiked}
            onLeaderboardPress={onLeaderBoardPress}
            onGroupPress={onGroupPress}
            onNotificationPress={onNotificationPress}
            onBookingPress={onBookingPress}
        />
    );
}