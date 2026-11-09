/**
 * @file BusinessReviewsTab.tsx
 * @description Renders Tab 3 (Reviews) of the Business Profile screen.
 * Displays the dynamically calculated rating summary and lists community reviews
 * from hikes booked with or offered by the tour business using PostCard.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import PostCard from '@/src/components/PostCard';
import PostCardSkeleton from '@/src/components/PostCardSkeleton';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IReview } from '@/src/core/models/Review/Review';

/**
 * Props for the BusinessReviewsTab component.
 *
 * @param reviews - Filtered array of reviews associated with this business's booked hikes and offers.
 * @param rating - Dynamically calculated average rating score from the collected reviews.
 * @param reviewsCount - Total count of collected reviews for this business.
 * @param isLoading - Whether review data is actively loading.
 * @param likeReview - Callback to toggle like on a review post.
 * @param isLiked - Predicate checking if the logged-in user liked a review post.
 * @param onWriteReviewPress - Callback to edit an owned review post.
 */
interface Props {
    reviews?: IReview[];
    rating?: number;
    reviewsCount?: number;
    isLoading?: boolean;
    likeReview?: (review: IReview) => void;
    isLiked?: (review: IReview) => boolean;
    onWriteReviewPress?: (review: IReview) => void;
}

/**
 * BusinessReviewsTab — Displays the calculated rating summary and PostCard feed for a tour business.
 *
 * @param props - Component props
 * @returns React.JSX.Element rendering the business reviews tab
 */
const BusinessReviewsTab = ({
    reviews = [],
    rating = 0,
    reviewsCount = 0,
    isLoading = false,
    likeReview,
    isLiked,
    onWriteReviewPress,
}: Props): React.JSX.Element => {
    const hasReviews = reviews.length > 0;

    return (
        <View style={styles.container}>
            {/* Calculated Business Rating Summary Header */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                    <View style={styles.iconCircle}>
                        <CustomIcon
                            library="AntDesign"
                            name="star"
                            size={18}
                            color={Colors.YELLOW}
                        />
                    </View>

                    <View style={styles.summaryTextGroup}>
                        <CustomText style={styles.summaryTitle}>
                            Hiker Review Rating
                        </CustomText>
                        <CustomText variant="caption" style={styles.summarySubtitle}>
                            Calculated from verified hike reviews on packages offered by this organizer
                        </CustomText>
                    </View>
                </View>

                <View style={styles.scoreBadge}>
                    <CustomText style={styles.scoreValue}>
                        {hasReviews ? rating.toFixed(1) : 'N/A'}
                    </CustomText>
                    <CustomText variant="caption" style={styles.scoreCountText}>
                        {`${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'}`}
                    </CustomText>
                </View>
            </View>

            {/* Loading State (Skeleton Over Spinner — Doherty Threshold) */}
            {isLoading && !hasReviews && (
                <View style={styles.feedList}>
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                </View>
            )}

            {/* Populated Review Posts Feed */}
            {hasReviews && (
                <View style={styles.feedList}>
                    {reviews.map((item) => (
                        <PostCard
                            key={item.id}
                            review={item}
                            variant="community"
                            onLike={likeReview ? () => likeReview(item) : undefined}
                            isLiked={isLiked}
                            onEdit={onWriteReviewPress ? () => onWriteReviewPress(item) : undefined}
                        />
                    ))}
                </View>
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
                        No Hike Reviews Yet
                    </CustomText>
                    <CustomText variant="caption" style={styles.emptySubtitle}>
                        Community reviews from hikers who booked and completed trails with this tour partner will appear here.
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
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
        ...GlobalStyles.dropShadow(2),
    },
    summaryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.STATUS_WARNING_BG,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTextGroup: {
        flex: 1,
        gap: 2,
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    summarySubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
    },
    scoreBadge: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingLeft: 8,
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.PRIMARY,
    },
    scoreCountText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },
    feedList: {
        gap: 20,
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

