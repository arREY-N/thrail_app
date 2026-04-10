import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';

// --- DUMMY DATA ---
const DUMMY_LEADERBOARD = [
    { id: '1', rank: 1, username: 'MountainKing', score: 15420, trend: 'up' },
    { id: '2', rank: 2, username: 'TrailBlazer_99', score: 14200, trend: 'same' },
    { id: '3', rank: 3, username: 'SkyWalker', score: 13850, trend: 'up' },
    { id: '4', rank: 4, username: 'ForestRanger', score: 12100, trend: 'down' },
    { id: '5', rank: 5, username: 'EchoHiker', score: 11900, trend: 'up' },
    { id: '6', rank: 6, username: 'SummitSeeker', score: 10500, trend: 'same' },
    { id: '7', rank: 7, username: 'CanyonCrawler', score: 9800, trend: 'down' },
    { id: '8', rank: 8, username: 'RidgeRunner', score: 9200, trend: 'up' },
    { id: '9', rank: 9, username: 'PeakMaster', score: 8900, trend: 'down' },
    { id: '10', rank: 10, username: 'ValleyVagabond', score: 8500, trend: 'same' },
];

const CURRENT_USER_DUMMY = { id: 'u1', rank: 42, username: 'Emmanuel@91', score: 3200, trend: 'up' };

const LeaderboardScreen = ({ onBackPress }) => {
    const [activeTab, setActiveTab] = useState('monthly');

    const topThree = DUMMY_LEADERBOARD.slice(0, 3);
    const restOfList = DUMMY_LEADERBOARD.slice(3);

    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '?';

    const renderTrendIcon = (trend) => {
        if (trend === 'up') return <CustomIcon library="Feather" name="trending-up" size={14} color={Colors.SUCCESS} />;
        if (trend === 'down') return <CustomIcon library="Feather" name="trending-down" size={14} color={Colors.ERROR} />;
        return <CustomIcon library="Feather" name="minus" size={14} color={Colors.GRAY_MEDIUM} />;
    };

    const renderPodiumItem = (user, position) => {
        const isFirst = position === 1;
        const badgeColor = isFirst ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32';
        const sizeMultiplier = isFirst ? 1.2 : 1;

        if (!user) return <View style={styles.podiumItem} />;

        return (
            <View style={[styles.podiumItem, isFirst && styles.podiumCenter]}>
                <View style={styles.podiumAvatarContainer}>
                    <View style={[styles.podiumAvatar, { borderColor: badgeColor, width: 60 * sizeMultiplier, height: 60 * sizeMultiplier, borderRadius: 30 * sizeMultiplier }]}>
                        <CustomText variant="h2" style={styles.podiumInitials}>
                            {getInitials(user.username)}
                        </CustomText>
                    </View>
                    <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
                        <CustomText variant="caption" style={styles.rankBadgeText}>{position}</CustomText>
                    </View>
                </View>
                
                <CustomText variant="caption" style={styles.podiumName} numberOfLines={1}>
                    {user.username}
                </CustomText>
                <CustomText variant="label" style={styles.podiumScore}>
                    {user.score.toLocaleString()} pts
                </CustomText>
            </View>
        );
    };

    const renderListItem = ({ item }) => (
        <View style={styles.listRow}>
            <View style={styles.rankContainer}>
                <CustomText variant="label" style={styles.rankText}>{item.rank}</CustomText>
                {renderTrendIcon(item.trend)}
            </View>

            <View style={styles.listAvatar}>
                <CustomText variant="caption" style={styles.listInitials}>
                    {getInitials(item.username)}
                </CustomText>
            </View>

            <View style={styles.listInfo}>
                <CustomText variant="body" style={styles.listName} numberOfLines={1}>
                    {item.username}
                </CustomText>
            </View>

            <CustomText variant="label" style={styles.listScore}>
                {item.score.toLocaleString()}
            </CustomText>
        </View>
    );

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader 
                title="Leaderboard" 
                centerTitle 
                onBackPress={onBackPress} 
            />

            <View style={styles.tabContainer}>
                {['weekly', 'monthly', 'all_time'].map((tab) => (
                    <TouchableOpacity 
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <CustomText 
                            variant="caption" 
                            style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
                        >
                            {tab.replace('_', ' ').toUpperCase()}
                        </CustomText>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.container}>
                <FlatList
                    data={restOfList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderListItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.podiumContainer}>
                            {renderPodiumItem(topThree[1], 2)}
                            {renderPodiumItem(topThree[0], 1)}
                            {renderPodiumItem(topThree[2], 3)}
                        </View>
                    }
                />
            </View>

            <View style={styles.currentUserFooter}>
                <View style={styles.listRow}>
                    <View style={styles.rankContainer}>
                        <CustomText variant="label" style={styles.rankText}>{CURRENT_USER_DUMMY.rank}</CustomText>
                        {renderTrendIcon(CURRENT_USER_DUMMY.trend)}
                    </View>

                    <View style={[styles.listAvatar, { backgroundColor: Colors.PRIMARY }]}>
                        <CustomText variant="caption" style={[styles.listInitials, { color: Colors.WHITE }]}>
                            {getInitials(CURRENT_USER_DUMMY.username)}
                        </CustomText>
                    </View>

                    <View style={styles.listInfo}>
                        <CustomText variant="body" style={styles.listName} numberOfLines={1}>
                            {CURRENT_USER_DUMMY.username} (You)
                        </CustomText>
                    </View>

                    <CustomText variant="label" style={[styles.listScore, { color: Colors.PRIMARY }]}>
                        {CURRENT_USER_DUMMY.score.toLocaleString()}
                    </CustomText>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.BACKGROUND,
        gap: 8,
    },
    tabButton: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    tabButtonActive: {
        backgroundColor: Colors.PRIMARY,
        borderColor: Colors.PRIMARY,
    },
    tabText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    tabTextActive: {
        color: Colors.WHITE,
    },
    // Podium
    podiumContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    podiumItem: {
        alignItems: 'center',
        flex: 1,
    },
    podiumCenter: {
        marginBottom: 20,
        zIndex: 10,
    },
    podiumAvatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    podiumAvatar: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    podiumInitials: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 0,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -4,
        alignSelf: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.WHITE,
    },
    rankBadgeText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 10,
    },
    podiumName: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 2,
    },
    podiumScore: {
        color: Colors.PRIMARY,
    },
    // List
    listContent: {
        paddingBottom: 100,
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        backgroundColor: Colors.WHITE,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: 8,
    },
    rankText: {
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
    },
    listAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listInitials: {
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
    },
    listInfo: {
        flex: 1,
    },
    listName: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    listScore: {
        color: Colors.TEXT_PRIMARY,
    },
    currentUserFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.WHITE,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        paddingBottom: 24,
        paddingTop: 8,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
});

export default LeaderboardScreen;