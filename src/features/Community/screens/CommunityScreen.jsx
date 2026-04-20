import React, { useMemo, useState } from 'react';
import {
    FlatList,
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

const CommunityScreen = ({ 
    reviews, 
    isLoading, 
    onRefresh, 
    onLeaderboardPress,
    likeReview,
    isLiked,
    onWriteReviewPress,
    isOwned,
    onGroupPress,
    onNotificationPress,
    onBookingPress,
}) => {
    
    const [activeTab, setActiveTab] = useState('Latest');
    const [searchQuery, setSearchQuery] = useState('');
    
    const { isDesktop, isTablet } = useBreakpoints();
    const isLargeScreen = isDesktop || isTablet;

    const sortedAndFilteredReviews = useMemo(() => {
        if (!reviews) return [];
        let filtered = [...reviews];

        if (searchQuery.trim().length > 0) {
            const query = searchQuery.trim().toLowerCase();
            
            filtered = filtered.filter(r => {
                const reviewText = String(r.review || '').toLowerCase();
                const userText = String(r.userName || '').toLowerCase();
                const mountainText = String(r.mountainName || r.trailName || '').toLowerCase();
                const locationText = String(r.location || '').toLowerCase();

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
                const dateA = new Date(a.rawReview?.createdAt || a.rawReview?.hikeDate || a.date).getTime();
                const dateB = new Date(b.rawReview?.createdAt || b.rawReview?.hikeDate || b.date).getTime();
                return (dateB || 0) - (dateA || 0); 
            });
        }

        return filtered;
    }, [reviews, activeTab, searchQuery]);

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
                            isLargeScreen && styles.scrollContentLarge
                        ]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.PRIMARY} />
                        }
                        renderItem={({ item }) => (
                            <PostCard 
                                review={item}
                                variant="community"
                                onLike={() => likeReview(item)}
                                isLiked={isLiked(item)}
                                onEdit={() => onWriteReviewPress(item)}
                                isOwned={isOwned(item)}
                            />
                        )}
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
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
        paddingHorizontal: 16,
        width: '100%',
        gap: 16
    },
    scrollContentLarge: {
        maxWidth: 680,
        alignSelf: 'center',
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