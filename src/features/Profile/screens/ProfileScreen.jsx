import React, { useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

import HikeLogTab from '@/src/features/Profile/screens/components/HikeLogTab';
import MilestonesTab from '@/src/features/Profile/screens/components/MilestonesTab';

const ProfileScreen = ({
    profile,
    role,
    stats,
    hikeLog,
    onSettingsPress,
    onLikeReview,
    isLiked,
    onEditReview
}) => {

    const [activeTab, setActiveTab] = useState('Milestones');

    const userName = profile?.firstname 
        ? `${profile.firstname} ${profile.lastname}` 
        : 'User Name';
    
    const userHandle = profile?.username 
        ? `@${profile.username}` 
        : '@username';

    const createdDate = profile?.createdAt 
        ? formatDate(profile.createdAt) 
        : 'Mar 2026';

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Profile"
                showDefaultIcons={true} 
                style={styles.transparentHeader}
            />

            <ScrollView 
                style={styles.contentArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.userBanner}>
                    <View style={styles.userInfoLeft}>
                        <View style={styles.avatarPlaceholder}>
                            <CustomIcon 
                                library="Feather" 
                                name="user" 
                                size={28} 
                                color={Colors.GRAY_MEDIUM} 
                            />
                        </View>
                        
                        <View style={styles.identityTextGroup}>
                            <CustomText variant="h2" style={styles.userNameText}>
                                {userName}
                            </CustomText>
                            <CustomText variant="caption" style={styles.userHandleText}>
                                {userHandle}
                            </CustomText>
                            <CustomText variant="caption" style={styles.memberSinceText}>
                                Member since {createdDate}
                            </CustomText>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.settingsButton}
                        onPress={onSettingsPress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="settings" 
                            size={22} 
                            color={Colors.TEXT_PRIMARY} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabsContainerWrapper}>
                    <View style={styles.floatingTabsContainer}>
                        
                        <TouchableOpacity 
                            style={[
                                styles.tabButton, 
                                activeTab === 'Milestones' && styles.tabButtonActive
                            ]}
                            onPress={() => setActiveTab('Milestones')}
                            activeOpacity={0.9}
                        >
                            <CustomText 
                                style={[
                                    styles.tabText, 
                                    activeTab === 'Milestones' && styles.tabTextActive
                                ]}
                            >
                                Milestones
                            </CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[
                                styles.tabButton, 
                                activeTab === 'Hike Log' && styles.tabButtonActive
                            ]}
                            onPress={() => setActiveTab('Hike Log')}
                            activeOpacity={0.9}
                        >
                            <CustomText 
                                style={[
                                    styles.tabText, 
                                    activeTab === 'Hike Log' && styles.tabTextActive
                                ]}
                            >
                                Hike Log
                            </CustomText>
                        </TouchableOpacity>

                    </View>
                </View>
                
                <View style={styles.tabContentContainer}>
                    {activeTab === 'Milestones' ? (
                        <MilestonesTab stats={stats} />
                    ) : (
                        <HikeLogTab 
                            hikeLog={hikeLog} 
                            onLikeReview={onLikeReview}
                            isLiked={isLiked}
                            onEditReview={onEditReview}
                        />
                    )}
                </View>
                
            </ScrollView>

        </ScreenWrapper>
    );
};

const tabShadow = Platform.select({
    ios: {
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    android: {
        elevation: 3,
    },
    web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    }
});

const styles = StyleSheet.create({
    transparentHeader: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        elevation: 0,
    },
    contentArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    tabContentContainer: {
        minHeight: 300,
        marginBottom: 24,
    },
    userBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    userInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    identityTextGroup: {
        justifyContent: 'center',
        gap: 2,
    },
    userNameText: {
        marginBottom: 0,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        letterSpacing: -0.5,
    },
    userHandleText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    memberSinceText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontSize: 12,
        marginTop: 2,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    tabsContainerWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    floatingTabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 4,
        borderRadius: 28,
        width: '100%', 
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24, 
        backgroundColor: 'transparent',
    },
    tabButtonActive: {
        backgroundColor: Colors.WHITE, 
        ...tabShadow, 
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY, 
    },
    tabTextActive: {
        color: Colors.PRIMARY, 
        fontWeight: 'bold',
    }
});

export default ProfileScreen;