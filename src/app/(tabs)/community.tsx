/**
 * @file community.tsx
 * @description Expo Router tab controller page for the Community feed. Coordinates reviews state hooks, global navigation triggers, and scroll pagination/reload logic.
 */

import { useState } from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useReview, useReviewList } from '@/src/core/models/Review/Review';
import CommunityScreen from '@/src/features/Community/screens/CommunityScreen';

/**
 * community tab router component - Arrowless layout composition matching Expo Router rules.
 * Manages responsive pagination states and error callbacks for the community review feed.
 */
export default function Community() {
    const {
        onWriteReviewPress,
        likeReview,
        isLiked,
    } = useReview();

    const {
        reviews,
        isLoading,
        refresh,
    } = useReviewList();

    const {
        onGroupPress,
        onNotificationPress,
        onBookingPress,
        onLeaderBoardPress
    } = useAppNavigation();

    // TODO: Replace this mock pagination simulation with real backend API request logic:
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [displayedReviewsCount, setDisplayedReviewsCount] = useState(10);
    const [isError, setIsError] = useState(false);
    const [loadCount, setLoadCount] = useState(0);

    /**
     * handleLoadMore - Triggered when the user scrolls near the bottom of the feed list.
     * 
     * TODO: Replace this mock simulation with real backend API request:
     * - Call repository query.
     * - On success: append loaded reviews to the existing reviews list, and update lastVisibleDoc cursor.
     * - On error: set `isError(true)` to prompt the Tap-to-Reload button UI in the footer.
     */
    const handleLoadMore = () => {
        if (isFetchingMore || !hasMore) return;

        setIsError(false);
        setIsFetchingMore(true);
        // Simulate a 1.5s network delay to retrieve the next page of reviews
        setTimeout(() => {
            // Mock a failure on the 2nd pagination load to test the error/reload flow
            if (loadCount === 1) {
                setIsError(true);
                setIsFetchingMore(false);
                setLoadCount(prev => prev + 1);
                return;
            }

            // Simulate successful pagination load
            setDisplayedReviewsCount(prev => {
                const nextCount = prev + 5;
                if (nextCount >= reviews.length) {
                    setHasMore(false);
                }
                return nextCount;
            });
            setLoadCount(prev => prev + 1); // Increment load count to track pagination attempts
            setIsFetchingMore(false); // Reset fetching state after the simulated load
        }, 1500);
    };

    /**
     * handleReload - Triggered when reloading the feed after an error occurs.
     * 
     * TODO: Reset pagination cursors, set isError/isFetchingMore to false,
     * and trigger a fresh Page 1 query refetch from the database.
     */
    const handleReload = () => {
        setIsError(false); // Reset error state
        setIsFetchingMore(false); // Reset fetching state
        setHasMore(true); // Reset hasMore state to allow further pagination
        setLoadCount(0); // Reset load count to start pagination from the beginning
        setDisplayedReviewsCount(10); // Reset displayed reviews count to initial value
        refresh(); // Trigger a fresh refetch of the feed data from the database
    };

    const slicedReviews = reviews.slice(0, displayedReviewsCount);

    return (
        <CommunityScreen
            reviews={slicedReviews}
            isLoading={isLoading}
            onWriteReviewPress={onWriteReviewPress}
            likeReview={likeReview}
            isLiked={isLiked}
            onRefresh={refresh}
            onLeaderboardPress={onLeaderBoardPress}
            onGroupPress={onGroupPress}
            onNotificationPress={onNotificationPress}
            onBookingPress={onBookingPress}
            onLoadMore={handleLoadMore}
            isFetchingMore={isFetchingMore}
            hasMore={hasMore}
            isError={isError}
            onReload={handleReload}
        />
    );
}