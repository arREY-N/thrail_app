/**
 * @file LeaderboardScreen.tsx
 * @description Mountain-themed Leaderboard View component displaying Top 3 Mountain Peaks, Metric Filter Tabs, Ranking Cards (#4+), Top Hiker Detail Modal, and Sticky User Standing Footer.
 */

import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import CustomToast from '@/src/components/CustomToast';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { RankedUsers } from '@/src/core/models/Leaderboard/Leaderboard';
import { User } from '@/src/core/models/User/User';
import LeaderboardRankCard from '@/src/features/Community/screens/Leaderboard/components/LeaderboardRankCard';
import MetricFilterTabs, { LeaderboardMetric } from '@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs';
import MountainPodium from '@/src/features/Community/screens/Leaderboard/components/MountainPodium';
import TopUserDetailModal from '@/src/features/Community/screens/Leaderboard/components/TopUserDetailModal';
import { useLeaderboardView } from '@/src/features/Community/screens/Leaderboard/hooks/useLeaderboardView';
import { formatMetricValue } from '@/src/features/Community/screens/Leaderboard/utils/leaderboardFormatters';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Interface representing the properties for LeaderboardScreen.
 * 
 * @param userRankings - The raw array of ranked users fetched from the backend or dummy data
 * @param activeMetric - Selected metric filter ('distance' | 'elevation' | 'hikes')
 * @param onMetricChange - Callback when switching metric filters
 * @param onBackPress - Callback to navigate back
 * @param onExplorePress - Callback to navigate to explore trails from empty state
 * @param isLoading - Optional flag indicating data loading state
 * @param activeUserId - Optional logged-in user ID
 * @param activeUsername - Optional logged-in username
 * @param profile - Optional logged-in user profile
 */
export interface LeaderboardScreenProps {
    userRankings: RankedUsers<Date>[];
    activeMetric: LeaderboardMetric;
    onMetricChange: (metric: LeaderboardMetric) => void;
    onBackPress: () => void;
    onExplorePress?: () => void;
    isLoading?: boolean;
    activeUserId?: string;
    activeUsername?: string;
    profile?: Partial<User> | null;
}

/**
 * LeaderboardScreen — Mountain-themed community leaderboard view with internal view processing.
 * 
 * @param props - LeaderboardScreenProps
 * @returns {React.JSX.Element} The rendered leaderboard screen layout.
 */
const LeaderboardScreen = ({
    userRankings,
    activeMetric,
    onMetricChange,
    onBackPress,
    onExplorePress,
    isLoading = false,
    activeUserId,
    activeUsername,
    profile,
}: LeaderboardScreenProps): React.JSX.Element => {
    const { isDesktop } = useBreakpoints();
    const insets = useSafeAreaInsets();
    const safeBottomPadding = Math.max(insets.bottom, 16);
    const [selectedTopUser, setSelectedTopUser] = useState<RankedUsers<Date> | null>(null);
    const [showResetToast, setShowResetToast] = useState(false);

    const {
        topThree,
        restOfList,
        currentUserData,
        currentMonthStr,
        nextMonthStr,
    } = useLeaderboardView({
        userRankings,
        activeMetric,
        activeUserId,
        activeUsername,
        profile,
    });

    const renderListItem = useCallback(
        ({ item }: ListRenderItemInfo<RankedUsers<Date>>) => (
            <LeaderboardRankCard 
                user={item} 
                activeMetric={activeMetric} 
                onSelectUser={setSelectedTopUser}
                currentUserId={currentUserData?.userId}
            />
        ),
        [activeMetric, currentUserData?.userId]
    );

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                centerTitle={true}
                onBackPress={onBackPress}
                rightActions={
                    <TouchableOpacity 
                        style={styles.resetBadge}
                        activeOpacity={0.7}
                        onPress={() => setShowResetToast(true)}
                    >
                        <CustomIcon library="MaterialCommunityIcons" name="timer-outline" size={12} color={Colors.PRIMARY} />
                        <CustomText variant="caption" style={styles.resetBadgeText}>
                            {nextMonthStr.split(',')[0]}
                        </CustomText>
                    </TouchableOpacity>
                }
            >
                <View style={styles.headerContentBox}>
                    <CustomText variant="h3" style={styles.headerTitle}>
                        Leaderboard
                    </CustomText>
                    <CustomText variant="caption" style={styles.headerSubtitle}>
                        {currentMonthStr} Rankings
                    </CustomText>
                </View>
            </CustomHeader>

            <View style={[styles.mainContainer, isDesktop && styles.desktopContainer]}>
                {/* Metric Selection Tabs */}
                <MetricFilterTabs
                    activeMetric={activeMetric}
                    onMetricChange={onMetricChange}
                />

                {isLoading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color={Colors.PRIMARY} />
                        <CustomText variant="h2" style={styles.emptyTitle}>
                            Loading Rankings...
                        </CustomText>
                    </View>
                ) : restOfList.length === 0 && topThree.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <CustomIcon
                            library="MaterialCommunityIcons"
                            name="image-filter-hdr"
                            size={56}
                            color={Colors.GRAY_MEDIUM}
                        />
                        <CustomText variant="h3" style={styles.emptyTitle}>
                            No Rankings Yet
                        </CustomText>
                        <CustomText variant="caption" style={styles.emptySubtitle}>
                            Be the first! Complete a hike this month to claim the #1 spot on the podium.
                        </CustomText>
                        {onExplorePress && (
                            <CustomButton
                                title="Explore Trails"
                                icon="compass"
                                iconLibrary="Feather"
                                variant="primary"
                                onPress={onExplorePress}
                                style={styles.emptyButton}
                            />
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={restOfList}
                        keyExtractor={(item) => item.userId || item.username}
                        renderItem={renderListItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 110 + insets.bottom }]}
                        ListHeaderComponent={
                            <View style={styles.podiumWrapper}>
                                <MountainPodium
                                    topThree={topThree}
                                    activeMetric={activeMetric}
                                    onSelectUser={setSelectedTopUser}
                                />
                            </View>
                        }
                    />
                )}
            </View>

            {/* Sticky Logged-In User Standing Footer */}
            {currentUserData && (
                <TouchableOpacity 
                    style={[styles.currentUserFooter, { paddingBottom: safeBottomPadding }]}
                    activeOpacity={currentUserData.rank > 0 ? 0.8 : 1}
                    disabled={currentUserData.rank === 0}
                    onPress={() => {
                        if (currentUserData.rank > 0) {
                            setSelectedTopUser(currentUserData);
                        }
                    }}
                >
                    <View style={styles.footerRow}>
                        <View style={styles.footerRankBox}>
                            <CustomText variant="label" style={styles.footerRankText}>
                                {currentUserData.rank > 99
                                    ? '99+'
                                    : currentUserData.rank > 0
                                    ? `#${currentUserData.rank}`
                                    : '--'}
                            </CustomText>
                        </View>

                        <View style={styles.footerAvatarBox}>
                            {currentUserData.profileImage ? (
                                <CustomImage
                                    source={{ uri: currentUserData.profileImage }}
                                    style={styles.footerAvatarImage}
                                />
                            ) : (
                                <View style={styles.footerInitialsBox}>
                                    <CustomText variant="caption" style={styles.footerInitialsText}>
                                        {getInitials(
                                            `${currentUserData.firstname || ''} ${currentUserData.lastname || ''}`.trim() || currentUserData.username
                                        )}
                                    </CustomText>
                                </View>
                            )}
                        </View>

                        <View style={styles.footerInfoBox}>
                            <CustomText variant="body" style={styles.footerNameText} numberOfLines={1}>
                                {currentUserData.username} (You)
                            </CustomText>
                            <CustomText variant="caption" style={styles.footerSubtext}>
                                {currentUserData.rank > 0 ? 'Your Standing' : 'Unranked'}
                            </CustomText>
                        </View>

                        <CustomText variant="label" style={styles.footerScoreText}>
                            {formatMetricValue(currentUserData, activeMetric)}
                        </CustomText>
                    </View>
                </TouchableOpacity>
            )}

            {/* Interactive Detail Modal for Top 1-3 Hiker */}
            <TopUserDetailModal
                visible={!!selectedTopUser}
                user={selectedTopUser}
                onClose={() => setSelectedTopUser(null)}
                currentUserId={currentUserData?.userId}
            />

            <CustomToast
                message={`Next rankings update on ${nextMonthStr}.`}
                visible={showResetToast}
                onHide={() => setShowResetToast(false)}
                type="info"
                position="sticky_footer"
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    desktopContainer: {
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 110,
    },
    emptyTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginTop: 12,
        marginBottom: 4,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
        fontSize: 13,
    },
    emptyButton: {
        marginTop: 20,
        paddingHorizontal: 24,
    },
    podiumWrapper: {
        marginBottom: 16,
    },
    listContent: {
        // paddingTop: 12,
    },
    headerContentBox: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    headerSubtitle: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 0,
    },
    resetBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.CHIP_PRIMARY_BG,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        gap: 4,
    },
    resetBadgeText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 10,
    },
    currentUserFooter: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        backgroundColor: Colors.WHITE,
        paddingHorizontal: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        ...GlobalStyles.dropShadow(10, 0.1, Colors.SHADOW, {
            offset: { width: 0, height: -4 },
            radius: 4,
        }),
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerRankBox: {
        width: 36,
        alignItems: 'center',
        marginRight: 8,
    },
    footerRankText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 15,
    },
    footerAvatarBox: {
        marginRight: 12,
    },
    footerAvatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    footerInitialsBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerInitialsText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
    },
    footerInfoBox: {
        flex: 1,
    },
    footerNameText: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    footerSubtext: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    footerScoreText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 8,
    },
});

export default LeaderboardScreen;
