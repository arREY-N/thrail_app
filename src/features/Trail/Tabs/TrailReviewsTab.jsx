import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';

import PostCard from '@/src/components/PostCard';

import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const TrailReviewsTab = ({
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

    const renderPostCard = useCallback(({ item }) => (
        <PostCard 
            review={item}
            variant="community"
            onLike={() => likeReview(item)}
            isLiked={isLiked(item)}
            onEdit={() => onWriteReviewPress(item)}
            isOwned={isOwned(item)}
        />
    ), [likeReview, isLiked, onWriteReviewPress, isOwned]);

    return (
        <View style={styles.tabContent}>
            <FlatList
                data={reviews ?? []}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.scrollContent,
                    { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
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
        paddingTop: 0,
        paddingBottom: 40,
        paddingHorizontal: 0,
        gap: 16
    },
    emptyStateContainer: {
        paddingTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 12,
    },
    emptyStateText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontStyle: 'italic',
        fontSize: 16,
    },
});

export default TrailReviewsTab;