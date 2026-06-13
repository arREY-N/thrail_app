import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    ListRenderItemInfo,
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
import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the CommunityScreen component.
 */
export interface CommunityScreenProps {
    /** Array of review/post data */
    reviews: any[];
    /** Indicates if feed is currently loading/refreshing */
    isLoading: boolean;
    /** Callback to pull-to-refresh the feed */
    onRefresh: () => void;
    /** Callback to navigate to the leaderboard */
    onLeaderboardPress: () => void;
    /** Callback to toggle like on a review */
    likeReview: (review: any) => void;
    /** Helper to check if current user liked a review */
    isLiked: (review: any) => boolean | Boolean;
    /** Callback to edit/write a review */
    onWriteReviewPress: (id?: string) => void;
    /** Callback for floating action button */
    onGroupPress: () => void;
    /** Callback to open notifications */
    onNotificationPress: () => void;
    /** Callback to open bookings */
    onBookingPress: () => void;
}

/**
 * Main Community Screen displaying user reviews, posts, and activities.
 */
const CommunityScreen = ({ 
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
}: CommunityScreenProps) => {
    
    const [activeTab, setActiveTab] = useState('Latest');
    const [searchQuery, setSearchQuery] = useState('');
    
    const { isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth = isDesktop ? 800 : (isTablet ? 650 : '100%');

    const sortedAndFilteredReviews = useMemo(() => {
        if (!reviews) return [];
        let filtered = [...reviews];

        if (searchQuery.trim().length > 0) {
            const query = searchQuery.trim().toLowerCase();
            
            filtered = filtered.filter(r => {
                const reviewText = String(r.review || '').toLowerCase();
                const userText = String((r as any).userName || '').toLowerCase();
                const mountainText = String((r as any).mountainName || (r as any).trailName || '').toLowerCase();
                const locationText = String((r as any).location || '').toLowerCase();

                return reviewText.includes(query) || 
                       userText.includes(query) || 
                       mountainText.includes(query) || 
                       locationText.includes(query);
            });
        }
        
        if (activeTab === 'Popular') {
            filtered.sort((a, b) => {
                const aLikes = Array.isArray(a.likes) ? a.likes.length : (Number(a.likes) || 0);
                const bLikes = Array.isArray(b.likes) ? b.likes.length : (Number(b.likes) || 0);
                return bLikes - aLikes;
            });
        } else if (activeTab === 'Latest') {
            filtered.sort((a, b) => {
                const dateA = new Date((a as any).rawReview?.createdAt || (a as any).rawReview?.hikeDate || (a as any).date).getTime();
                const dateB = new Date((b as any).rawReview?.createdAt || (b as any).rawReview?.hikeDate || (b as any).date).getTime();
                return (dateB || 0) - (dateA || 0); 
            });
        }

        return filtered;
    }, [reviews, activeTab, searchQuery]);

    const renderPostCard = useCallback(({ item }: ListRenderItemInfo<any>) => (
        <PostCard 
            review={item}
            variant="community"
            onLike={() => likeReview(item)}
            isLiked={Boolean(isLiked(item))}
            onEdit={() => onWriteReviewPress(item.id)}
        />
    ), [likeReview, isLiked, onWriteReviewPress]);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.container}>
                
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
                        tabs: ['Latest', 'Popular'],
                        activeTab: activeTab,
                        onTabSelect: setActiveTab
                    }}
                    rightActions={
                        <>
                            <TouchableOpacity 
                                style={styles.headerActionIcon} 
                                onPress={onNotificationPress}
                                activeOpacity={0.7}
                            >
                                <CustomIcon library="Ionicons" name="notifications" size={24} color={Colors.PRIMARY} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.headerActionIcon} 
                                onPress={onBookingPress}
                                activeOpacity={0.7}
                            >
                                <CustomIcon library="Ionicons" name="calendar-clear" size={24} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        </>
                    }
                />

                <View style={styles.feedWrapper}>
                    <FlatList
                        data={sortedAndFilteredReviews}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={[
                            styles.scrollContent,
                            { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
                        ]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.PRIMARY} />
                        }
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
    headerActionIcon: {
        padding: 4,
    },
    feedWrapper: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 0,
        paddingBottom: 40,
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
});

export default CommunityScreen;
