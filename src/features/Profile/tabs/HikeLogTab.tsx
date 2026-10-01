/**
 * @file HikeLogTab.tsx
 * @description Profile hike log tab displaying the current user's own review cards
 * with FlatList-based rendering, FadeInView entry animations, PostCardSkeleton loading
 * state, onEndReached pagination, and footer states for end-of-list and loading.
 */

import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import PostCard from '@/src/components/PostCard';
import PostCardSkeleton from '@/src/components/PostCardSkeleton';

import { Colors } from '@/src/constants/colors';
import { Review } from '@/src/core/models/Review/Review';

/**
 * Props for the HikeLogTab component.
 *
 * @param hikeLog - Array of the current user's own review records to display.
 * @param isLoading - When true, renders PostCardSkeleton placeholders instead of empty state.
 * @param error - Error message string if data fetching failed, null otherwise.
 * @param onRetry - Callback triggered when the reload/retry button is pressed.
 * @param onLikeReview - Callback fired when the like button on a card is pressed.
 * @param isLiked - Helper to check whether the current user has liked a given review.
 * @param onEditReview - Callback fired when the edit icon on a card is pressed; receives the review ID.
 * @param onSeeMore - Callback fired when the list is scrolled near the bottom to reveal more items.
 * @param hasMore - When true, the list has more items to reveal; shows spinner footer.
 */
export interface HikeLogTabProps {
    hikeLog?: Review[];
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    onLikeReview: (review: Review) => void;
    isLiked: (review: Review) => boolean;
    onEditReview: (id: string) => void;
    onSeeMore?: () => void;
    hasMore?: boolean;
}

/**
 * HikeLogTab — Displays the current user's own hike review cards in a
 * performance-optimised FlatList with FadeInView animations, skeleton loading,
 * error recovery, and scroll-driven pagination.
 */
const HikeLogTab = ({
    hikeLog,
    isLoading = false,
    error = null,
    onRetry,
    onLikeReview,
    isLiked,
    onEditReview,
    onSeeMore,
    hasMore = false,
}: HikeLogTabProps): React.JSX.Element => {

    const renderFooter = useCallback((): React.JSX.Element | null => {
        if (hasMore) {
            return (
                <View style={styles.footerContainer}>
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                </View>
            );
        }
        if (Boolean(error) && hikeLog && hikeLog.length > 0) {
            return (
                <View style={styles.footerContainer}>
                    <TouchableOpacity
                        style={styles.footerRetryButton}
                        onPress={onSeeMore}
                        activeOpacity={0.7}
                    >
                        <CustomText style={styles.footerRetryText}>
                            Failed to load more. Tap to retry
                        </CustomText>
                    </TouchableOpacity>
                </View>
            );
        }
        if (!hasMore && hikeLog && hikeLog.length > 0) {
            return (
                <View style={styles.footerContainer}>
                    <CustomText style={styles.footerText}>
                        No more hikes to show.
                    </CustomText>
                </View>
            );
        }
        return null;
    }, [hasMore, error, hikeLog, onSeeMore]);

    if (isLoading) {
        return (
            <View style={styles.skeletonContainer}>
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
            </View>
        );
    }

    if (Boolean(error) && (!hikeLog || hikeLog.length === 0)) {
        return (
            <View style={styles.emptyState}>
                <View style={styles.errorWrapper}>
                    <ErrorMessage error={error} />
                </View>
                {onRetry && (
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={onRetry}
                        activeOpacity={0.7}
                    >
                        <CustomText style={styles.retryButtonText}>
                            Reload Hike Log
                        </CustomText>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    if (!hikeLog || hikeLog.length === 0) {
        return (
            <View style={styles.emptyState}>
                <CustomIcon
                    library="Feather"
                    name="edit-3"
                    size={48}
                    color={Colors.GRAY_LIGHT}
                />
                <CustomText style={styles.emptyText}>
                    No hikes logged yet.
                </CustomText>
            </View>
        );
    }

    return (
        <View style={styles.listContent}>
            {hikeLog.map((item) => (
                <PostCard
                    key={item.id}
                    review={item}
                    variant="profile"
                    isLiked={isLiked}
                    onLike={() => onLikeReview(item)}
                    onEdit={() => onEditReview(item.id)}
                />
            ))}
            {renderFooter()}
        </View>
    );
};

const styles = StyleSheet.create({
    listContent: {
        gap: 16,
        paddingBottom: 24,
    },
    skeletonContainer: {
        gap: 16,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
    },
    footerContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontStyle: 'italic',
        fontSize: 14,
    },
    footerRetryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    footerRetryText: {
        color: Colors.PRIMARY,
        fontSize: 13,
        fontWeight: '600',
    },
    errorWrapper: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    retryButton: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: Colors.PRIMARY,
        alignItems: 'center',
    },
    retryButtonText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default HikeLogTab;

