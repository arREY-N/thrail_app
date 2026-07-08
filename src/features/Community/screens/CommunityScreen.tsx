/**
 * @file CommunityScreen.tsx
 * @description Main community feed screen rendering user review cards, sorting filters, collapsible header transition animations, and infinite scroll pagination.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    ListRenderItemInfo,
    Platform,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomFAB from '@/src/components/CustomFAB';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import PostCard from '@/src/components/PostCard';
import PostCardSkeleton from '@/src/components/PostCardSkeleton';
import { Colors } from '@/src/constants/colors';
import { Review } from '@/src/core/models/Review/Review';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { useCommunity } from '../hooks/useCommunity';

/**
 * Animated View component to handle smooth mounting fade-ins of feed list cards.
 */
const FadeInView: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    return (
        <Animated.View style={{ opacity: fadeAnim }}>
            {children}
        </Animated.View>
    );
};

/**
 * Props for the CommunityScreen component.
 * 
 * @param reviews - Array of review/post data to display in the feed.
 * @param isLoading - Indicates if the reviews query is currently loading/refreshing.
 * @param onRefresh - Callback triggered on pull-to-refresh action.
 * @param onLeaderboardPress - Callback to navigate to the leaderboard screen.
 * @param likeReview - Callback to toggle likes on reviews.
 * @param isLiked - Helper function to check if the current user has liked a review.
 * @param onWriteReviewPress - Callback to edit/write reviews.
 * @param onGroupPress - Callback for floating action button to create groups.
 * @param onNotificationPress - Callback to open notification screen.
 * @param onBookingPress - Callback to open booking screen.
 * @param onLoadMore - Callback fired when scrolling close to the bottom to fetch more reviews.
 * @param isFetchingMore - Flag showing if additional pagination pages are fetching.
 * @param hasMore - Flag indicating if more reviews are available from the backend.
 * @param isError - Flag showing if the query has failed.
 * @param onReload - Callback triggered to reload the review feed.
 */
export interface CommunityScreenProps {
    reviews: Review[];
    isLoading: boolean;
    onRefresh: () => void;
    onLeaderboardPress: () => void;
    likeReview: (review: Review) => void;
    isLiked: (review: Review) => boolean;
    onWriteReviewPress: (id?: string) => void;
    onGroupPress: () => void;
    onNotificationPress: () => void;
    onBookingPress: () => void;
    onLoadMore?: () => void;
    isFetchingMore?: boolean;
    hasMore?: boolean;
    isError?: boolean;
    onReload?: () => void;
}

/**
 * CommunityScreen — Displays user reviews, posts, and leaderboard activities.
 * Implements smooth absolute scrolling, pagination loaders, and error reloads.
 */
const CommunityScreen: React.FC<CommunityScreenProps> = ({ 
    reviews, 
    isLoading, 
    onRefresh, 
    onLeaderboardPress,
    likeReview,
    isLiked,
    onWriteReviewPress,
    onGroupPress,
    onNotificationPress,
    onBookingPress,
    onLoadMore,
    isFetchingMore = false,
    hasMore = false,
    isError = false,
    onReload,
}) => {
    const { 
        searchQuery, 
        setSearchQuery, 
        activeTab, 
        setActiveTab, 
        filteredReviews 
    } = useCommunity(reviews);

    // Header animated scroll visibility states
    const [headerVisible, setHeaderVisible] = useState<boolean>(true);
    const lastOffsetY = useRef<number>(0);
    const animatedHeaderHeight = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden

    useEffect(() => {
        Animated.timing(animatedHeaderHeight, {
            toValue: headerVisible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [headerVisible]);

    const translateY = animatedHeaderHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [-260, 0], // Fully slide header off-screen vertically
    });

    const handleTabSelect = (tab: string) => {
        setActiveTab(tab);
    };
    
    const { isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth = isDesktop ? 800 : (isTablet ? 650 : '100%');

    const renderPostCard = useCallback(({ item }: ListRenderItemInfo<any>) => (
        <FadeInView>
            <PostCard 
                review={item}
                variant="community"
                onLike={() => likeReview(item)}
                isLiked={isLiked}
                onEdit={() => onWriteReviewPress(item)}
            />
        </FadeInView>
    ), [likeReview, isLiked, onWriteReviewPress]);

    const renderFooter = () => {
        if (isFetchingMore) {
            return (
                <View style={styles.footerLoaderContainer}>
                    <ActivityIndicator size="small" color={Colors.PRIMARY} />
                </View>
            );
        }
        if (isError && reviews.length > 0) {
            return (
                <View style={styles.footerLoaderContainer}>
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={onReload}
                        activeOpacity={0.7}
                    >
                        <CustomText style={styles.retryButtonText}>
                            Failed to load more. Tap to reload
                        </CustomText>
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    };

    const handleLoadMore = () => {
        if (hasMore && !isFetchingMore && !isError && onLoadMore) {
            onLoadMore();
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.container}>
                
                <Animated.View style={[
                    styles.headerAnimatedWrapper,
                    { transform: [{ translateY }] }
                ]}>
                    <CustomHeader 
                        title="Community"
                        showDefaultIcons={false}
                        hasSearch={true}
                        searchProps={{
                            searchPlaceholder: "Search posts or hikers...",
                            searchValue: searchQuery,
                            onSearchChange: setSearchQuery,
                            onChangeText: setSearchQuery,
                            rightIconLibrary: "MaterialCommunityIcons",
                            rightIconName: "podium",
                            onRightButtonPress: onLeaderboardPress,
                            tabs: [
                                'Latest', 
                                'Popular',
                                'Rating'
                            ],
                            activeTab: activeTab,
                            onTabSelect: handleTabSelect
                        }}
                        rightActions={
                            <>
                                <TouchableOpacity 
                                    style={styles.headerActionIcon} 
                                    onPress={onNotificationPress}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon 
                                        library="Ionicons" 
                                        name="notifications" 
                                        size={24} 
                                        color={Colors.PRIMARY} 
                                    />
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.headerActionIcon} 
                                    onPress={onBookingPress}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon 
                                        library="Ionicons" 
                                        name="calendar-clear" 
                                        size={24} 
                                        color={Colors.PRIMARY} 
                                    />
                                </TouchableOpacity>
                            </>
                        }
                    />
                </Animated.View>

                <View style={styles.feedWrapper}>
                    <FlatList
                        data={filteredReviews}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={[
                            styles.scrollContent,
                            { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingTop: 215 }
                        ]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.PRIMARY} />
                        }
                        renderItem={renderPostCard}
                        scrollEventThrottle={16}
                        onScroll={Animated.event(
                            [],
                            {
                                useNativeDriver: false,
                                listener: (event: any) => {
                                    const currentOffsetY = event.nativeEvent.contentOffset.y;
                                    if (currentOffsetY <= 50) {
                                        setHeaderVisible(true);
                                        lastOffsetY.current = currentOffsetY;
                                        return;
                                    }
                                    const diff = currentOffsetY - lastOffsetY.current;
                                    
                                    // Ignore layout size reflow changes / jumps
                                    if (Math.abs(diff) > 100) {
                                        lastOffsetY.current = currentOffsetY;
                                        return;
                                    }

                                    if (diff > 15 && headerVisible) {
                                        setHeaderVisible(false);
                                    } else if (diff < -15 && !headerVisible) {
                                        setHeaderVisible(true);
                                    }
                                    lastOffsetY.current = currentOffsetY;
                                }
                            }
                        )}
                        initialNumToRender={5}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        removeClippedSubviews={Platform.OS !== 'web'}
                        updateCellsBatchingPeriod={30}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={
                            isLoading ? (
                                <View style={{ gap: 16 }}>
                                    <PostCardSkeleton />
                                    <PostCardSkeleton />
                                    <PostCardSkeleton />
                                </View>
                            ) : isError ? (
                                <View style={styles.emptyStateContainer}>
                                    <CustomIcon library="Feather" name="alert-triangle" size={32} color={Colors.GRAY_MEDIUM} />
                                    <CustomText variant="caption" style={styles.emptyStateText}>
                                        Failed to load community reviews.
                                    </CustomText>
                                    <TouchableOpacity 
                                        style={styles.mainRetryButton} 
                                        onPress={onReload}
                                        activeOpacity={0.7}
                                    >
                                        <CustomText style={styles.mainRetryButtonText}>
                                            Reload Feed
                                        </CustomText>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.emptyStateContainer}>
                                    <CustomIcon library="Ionicons" name="trail-sign-outline" size={32} color={Colors.GRAY_MEDIUM} />
                                    <CustomText variant="caption" style={styles.emptyStateText}>
                                        {searchQuery ? "No posts found matching search." : "No community posts found."}
                                    </CustomText>
                                </View>
                            )
                        }
                    />
                </View>

                <CustomFAB onPress={onGroupPress} />

            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND, 
    },
    headerAnimatedWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerActionIcon: {
        padding: 4,
    },
    feedWrapper: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 48,
        paddingHorizontal: 16,
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
    footerLoaderContainer: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    retryButtonText: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
    },
    mainRetryButton: {
        marginTop: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: Colors.PRIMARY,
    },
    mainRetryButtonText: {
        fontSize: 14,
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
});

export default CommunityScreen;
