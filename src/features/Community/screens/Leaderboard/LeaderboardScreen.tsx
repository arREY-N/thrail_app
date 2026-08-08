/**
 * @file LeaderboardScreen.tsx
 * @description Mountain-themed Leaderboard View component displaying Top 3 Mountain Peaks, Metric Filter Tabs, Ranking Cards (#4+), Top Hiker Detail Modal, and Sticky User Standing Footer.
 */

import React, { useCallback, useState } from 'react';
import {
    FlatList,
    ListRenderItemInfo,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomLoading from '@/src/components/CustomLoading';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { RankedUsers } from '@/src/core/models/Leaderboard/interfaces/ILeaderboard';
import LeaderboardRankCard from '@/src/features/Community/screens/Leaderboard/components/LeaderboardRankCard';
import MetricFilterTabs, { LeaderboardMetric } from '@/src/features/Community/screens/Leaderboard/components/MetricFilterTabs';
import MountainPodium from '@/src/features/Community/screens/Leaderboard/components/MountainPodium';
import TopUserDetailModal from '@/src/features/Community/screens/Leaderboard/components/TopUserDetailModal';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Interface representing the properties for LeaderboardScreen.
 * 
 * @param userRankings - Sorted list of ranked users from backend Leaderboard<Date> model
 * @param currentUserData - Standing of the currently logged-in user
 * @param activeMetric - Selected metric filter ('distance' | 'elevation' | 'hikes')
 * @param onMetricChange - Callback when switching metric filters
 * @param onBackPress - Callback to navigate back
 * @param isLoading - Optional flag indicating data loading state
 */
export interface LeaderboardScreenProps {
    userRankings?: RankedUsers<Date>[];
    currentUserData?: RankedUsers<Date>;
    activeMetric: LeaderboardMetric;
    onMetricChange: (metric: LeaderboardMetric) => void;
    onBackPress: () => void;
    isLoading?: boolean;
}

/**
 * Helper to format metric display for current user standing footer.
 * 
 * @param user - User standing data
 * @param metric - Currently active metric
 * @returns {string} Formatted string
 */
const formatMetricValue = (user: RankedUsers<Date>, metric: LeaderboardMetric): string => {
    if (metric === 'distance') {
        return `${user.totalDistance.toFixed(1)} km`;
    }
    if (metric === 'elevation') {
        return `${user.totalElevation.toLocaleString()} m`;
    }
    return `${user.totalHikes} ${user.totalHikes === 1 ? 'hike' : 'hikes'}`;
};

/**
 * LeaderboardScreen — Pure dumb UI view for community leaderboard.
 * 
 * @param props - LeaderboardScreenProps
 * @returns {React.JSX.Element} The rendered leaderboard screen layout.
 */
const LeaderboardScreen = ({
    userRankings = [],
    currentUserData,
    activeMetric,
    onMetricChange,
    onBackPress,
    isLoading = false,
}: LeaderboardScreenProps): React.JSX.Element => {
    const { isDesktop } = useBreakpoints();
    const insets = useSafeAreaInsets();
    const safeBottomPadding = Math.max(insets.bottom, 16);
    const [selectedTopUser, setSelectedTopUser] = useState<RankedUsers<Date> | null>(null);

    // Sort rankings by current active metric
    const sortedRankings = [...userRankings].sort((a, b) => {
        if (activeMetric === 'distance') return b.totalDistance - a.totalDistance;
        if (activeMetric === 'elevation') return b.totalElevation - a.totalElevation;
        return b.totalHikes - a.totalHikes;
    });

    // Re-assign ranks based on current metric sort
    const rankedData = sortedRankings.map((user, idx) => ({
        ...user,
        rank: idx + 1,
    }));

    const topThree = rankedData.slice(0, 3);
    const restOfList = rankedData.slice(3);

    const renderListItem = useCallback(
        ({ item }: ListRenderItemInfo<RankedUsers<Date>>) => (
            <LeaderboardRankCard user={item} activeMetric={activeMetric} />
        ),
        [activeMetric]
    );

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                title="Leaderboard"
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <View style={[styles.mainContainer, isDesktop && styles.desktopContainer]}>
                {/* Metric Selection Tabs */}
                <MetricFilterTabs
                    activeMetric={activeMetric}
                    onMetricChange={onMetricChange}
                />

                {isLoading ? (
                    <View style={styles.loadingBox}>
                        <CustomLoading />
                    </View>
                ) : rankedData.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <CustomIcon
                            library="MaterialCommunityIcons"
                            name="image-filter-hdr"
                            size={56}
                            color={Colors.GRAY_MEDIUM}
                        />
                        <CustomText variant="h2" style={styles.emptyTitle}>
                            No Monthly Rankings Yet
                        </CustomText>
                        <CustomText variant="caption" style={styles.emptySubtitle}>
                            Complete a hike this month to earn your spot on the mountain podium!
                        </CustomText>
                    </View>
                ) : (
                    <FlatList
                        data={restOfList}
                        keyExtractor={(item) => item.userId || item.username}
                        renderItem={renderListItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={
                            <View style={{ marginBottom: 16 }}>
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
                <View style={[styles.currentUserFooter, { paddingBottom: safeBottomPadding }]}>
                    <View style={styles.footerRow}>
                        <View style={styles.footerRankBox}>
                            <CustomText variant="label" style={styles.footerRankText}>
                                #{currentUserData.rank}
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
                                Your Standing
                            </CustomText>
                        </View>

                        <CustomText variant="label" style={styles.footerScoreText}>
                            {formatMetricValue(currentUserData, activeMetric)}
                        </CustomText>
                    </View>
                </View>
            )}

            {/* Interactive Detail Modal for Top 1-3 Hiker */}
            <TopUserDetailModal
                visible={!!selectedTopUser}
                user={selectedTopUser}
                onClose={() => setSelectedTopUser(null)}
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
    loadingBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 60,
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
    listContent: {
        // paddingTop: 12,
        paddingBottom: 110,
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
