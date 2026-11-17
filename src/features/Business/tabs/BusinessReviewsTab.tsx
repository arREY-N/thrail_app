/**
 * @file BusinessReviewsTab.tsx
 * @description Renders Tab 3 (Reviews) of the Business Profile screen.
 * Displays the server-aggregated rating summary header and lists verified organizer reviews
 * submitted by hikers from booked hikes using BusinessReviewCard.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ListEndIndicator from '@/src/components/ListEndIndicator';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { BusinessReview } from '@/src/core/models/BusinessReview/BusinessReview';
import BusinessReviewCard from '@/src/features/Business/components/BusinessReviewCard';
import BusinessReviewCardSkeleton from '@/src/features/Business/components/BusinessReviewCardSkeleton';

/**
 * Props for the BusinessReviewsTab component.
 *
 * @param reviews - Array of BusinessReview items associated with this tour organizer.
 * @param totalReviewsCount - Total aggregated review count when more reviews exist beyond the stream limit.
 * @param isLoading - Whether business review data is actively loading.
 * @param onLikeReview - Callback fired when the like button is pressed on a review card.
 * @param isLiked - Helper returning whether the current user has liked a review.
 */
interface Props {
    reviews?: BusinessReview[];
    totalReviewsCount?: number;
    isLoading?: boolean;
    onLikeReview?: (review: BusinessReview) => void;
    isLiked?: (review: BusinessReview) => boolean;
}

/**
 * BusinessReviewsTab — Displays the verified BusinessReviewCard feed.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the business reviews tab
 */
const BusinessReviewsTab = ({
    reviews = [],
    totalReviewsCount,
    isLoading = false,
    onLikeReview,
    isLiked,
}: Props): React.JSX.Element => {
    const hasReviews = reviews.length > 0;
    const resolvedTotalCount = totalReviewsCount ?? reviews.length;
    const endIndicatorLabel = resolvedTotalCount > reviews.length
        ? `Showing latest ${reviews.length} of ${resolvedTotalCount} reviews.`
        : 'No more reviews to show.';

    return (
        <View style={styles.container}>
            {/* Loading State (Skeleton Over Spinner — Doherty Threshold) */}
            {isLoading && !hasReviews && (
                <View style={styles.feedList}>
                    <BusinessReviewCardSkeleton />
                    <BusinessReviewCardSkeleton />
                    <BusinessReviewCardSkeleton />
                </View>
            )}

            {/* Populated Organizer Reviews Feed */}
            {hasReviews && (
                <>
                    <View style={styles.feedList}>
                        {reviews.map((item) => (
                            <BusinessReviewCard
                                key={item.id}
                                review={item}
                                onLike={onLikeReview ? () => onLikeReview(item) : undefined}
                                isLiked={isLiked}
                            />
                        ))}
                    </View>
                    <ListEndIndicator
                        label={endIndicatorLabel}
                        maxWidth="100%"
                        style={styles.endIndicator}
                    />
                </>
            )}

            {/* Empty State */}
            {!hasReviews && !isLoading && (
                <View style={styles.emptyStateCard}>
                    <CustomIcon
                        library="Ionicons"
                        name="trail-sign-outline"
                        size={36}
                        color={Colors.GRAY_MEDIUM}
                    />
                    <CustomText style={styles.emptyTitle}>
                        No Organizer Reviews Yet
                    </CustomText>
                    <CustomText variant="caption" style={styles.emptySubtitle}>
                        Reviews from hikers who booked and completed trips with this tour partner will appear here.
                    </CustomText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 16,
    },
    feedList: {
        gap: 20,
    },
    endIndicator: {
        marginTop: 4,
    },
    emptyStateCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 8,
        ...GlobalStyles.dropShadow(1),
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 4,
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 19,
    },
});

export default BusinessReviewsTab;

