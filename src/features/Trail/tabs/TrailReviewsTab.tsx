import React from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

import PostCard from '@/src/components/PostCard';

import { IReview } from '@/src/core/models/Review/Review';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export interface TrailReviewsTabProps {
    reviews?: IReview[] | null;
    isLoading: boolean;
    likeReview: (review: IReview) => void;
    isLiked: (review: IReview) => boolean;
    onWriteReviewPress: (review: IReview) => void;
    isOwned: (review: IReview) => boolean;
}

const TrailReviewsTab: React.FC<TrailReviewsTabProps> = ({
    reviews,
    isLoading,
    likeReview,
    isLiked,
    onWriteReviewPress,
}) => {
    const { isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth: DimensionValue = isDesktop ? 800 : (isTablet ? 650 : '100%');

    const hasReviews = Boolean(reviews && reviews.length > 0);

    return (
        <View style={styles.tabContent}>
            <View
                style={[
                    styles.scrollContent,
                    { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
                ]}
            >
                {hasReviews && reviews?.map((item) => (
                    <PostCard
                        key={item.id}
                        review={item}
                        variant="community"
                        onLike={() => likeReview(item)}
                        isLiked={isLiked}
                        onEdit={() => onWriteReviewPress(item)}
                    />
                ))}

                {!hasReviews && !isLoading && (
                    <View style={styles.emptyStateContainer}>
                        <CustomIcon library="Ionicons" name="trail-sign-outline" size={32} color={Colors.GRAY_MEDIUM} />
                        <CustomText variant="caption" style={styles.emptyStateText}>
                            No community posts found.
                        </CustomText>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        gap: 20,
    },
    feedWrapper: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
        gap: 16,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
        marginTop: 10,
    },
    emptyStateText: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontSize: 14,
    },
});

export default TrailReviewsTab;