import React, { useCallback, useState } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

import PostCard from '@/src/components/PostCard';

import { IReview } from '@/src/core/models/Review/Review.types';
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
    isOwned,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const { isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth = isDesktop ? 800 : (isTablet ? 650 : '100%');

    const renderPostCard = useCallback(({ item }: ListRenderItemInfo<IReview>) => (
        <PostCard 
            review={item}
            variant="community"
            onLike={() => likeReview(item)}
            isLiked={isLiked(item)}
            onEdit={() => onWriteReviewPress(item)}
        />
    ), [likeReview, isLiked, onWriteReviewPress, isOwned]);

    return (
        <View style={styles.tabContent}>
            <FlatList
                data={reviews ?? []}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.scrollContent,
                    { maxWidth: contentMaxWidth as any, alignSelf: 'center', width: '100%' }
                ]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false} 
                nestedScrollEnabled={true}

                renderItem={renderPostCard}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyStateContainer}>
                            <CustomIcon library="Ionicons" name="trail-sign-outline" size={32} color={Colors.GRAY_MEDIUM} />
                            <CustomText variant="caption" style={styles.emptyStateText}>
                                {searchQuery ? "No posts found matching search." : "No community posts found."}
                            </CustomText>
                        </View>
                    ) : null
                }
            />
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