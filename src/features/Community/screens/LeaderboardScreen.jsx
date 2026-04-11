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

const LeaderboardScreen = ({ leaderboardData = [], currentUserData, onBackPress }) => {
    const [activeTab, setActiveTab] = useState('monthly');

    const topThree = leaderboardData.slice(0, 3);
    const restOfList = leaderboardData.slice(3);

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
                centerTitle={true}
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

            {currentUserData && (
                <View style={styles.currentUserFooter}>
                    <View style={styles.listRow}>
                        <View style={styles.rankContainer}>
                            <CustomText variant="label" style={styles.rankText}>{currentUserData.rank}</CustomText>
                            {renderTrendIcon(currentUserData.trend)}
                        </View>

                        <View style={[styles.listAvatar, { backgroundColor: Colors.PRIMARY }]}>
                            <CustomText variant="caption" style={[styles.listInitials, { color: Colors.WHITE }]}>
                                {getInitials(currentUserData.username)}
                            </CustomText>
                        </View>

                        <View style={styles.listInfo}>
                            <CustomText variant="body" style={styles.listName} numberOfLines={1}>
                                {currentUserData.username} (You)
                            </CustomText>
                        </View>

                        <CustomText variant="label" style={[styles.listScore, { color: Colors.PRIMARY }]}>
                            {currentUserData.score.toLocaleString()}
                        </CustomText>
                    </View>
                </View>
            )}
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabContainer: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.BACKGROUND, gap: 8 },
    tabButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.GRAY_ULTRALIGHT, borderWidth: 1, borderColor: Colors.GRAY_LIGHT },
    tabButtonActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
    tabText: { color: Colors.TEXT_SECONDARY, fontWeight: 'bold' },
    tabTextActive: { color: Colors.WHITE },
    podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingVertical: 24, paddingHorizontal: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_LIGHT },
    podiumItem: { alignItems: 'center', flex: 1 },
    podiumCenter: { marginBottom: 20, zIndex: 10 },
    podiumAvatarContainer: { position: 'relative', marginBottom: 8 },
    podiumAvatar: { backgroundColor: Colors.GRAY_ULTRALIGHT, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
    podiumInitials: { color: Colors.TEXT_SECONDARY, marginBottom: 0 },
    rankBadge: { position: 'absolute', bottom: -4, alignSelf: 'center', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.WHITE },
    rankBadgeText: { color: Colors.WHITE, fontWeight: 'bold', fontSize: 10 },
    podiumName: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY, marginBottom: 2 },
    podiumScore: { color: Colors.PRIMARY },
    listContent: { paddingBottom: 100 },
    listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.GRAY_ULTRALIGHT, backgroundColor: Colors.WHITE },
    rankContainer: { width: 40, alignItems: 'center', marginRight: 8 },
    rankText: { color: Colors.TEXT_SECONDARY, marginBottom: 2 },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.GRAY_ULTRALIGHT, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    listInitials: { fontWeight: 'bold', color: Colors.TEXT_SECONDARY },
    listInfo: { flex: 1 },
    listName: { fontWeight: 'bold', color: Colors.TEXT_PRIMARY },
    listScore: { color: Colors.TEXT_PRIMARY },
    currentUserFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.WHITE, borderTopWidth: 1, borderTopColor: Colors.GRAY_LIGHT, paddingBottom: 24, paddingTop: 8, shadowColor: Colors.SHADOW, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
});

export default LeaderboardScreen;