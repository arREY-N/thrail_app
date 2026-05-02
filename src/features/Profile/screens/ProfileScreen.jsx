import React, { useState } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomFAB from '@/src/components/CustomFAB';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import HikeLogTab from '@/src/features/Profile/screens/components/HikeLogTab';
import MilestonesTab from '@/src/features/Profile/screens/components/MilestonesTab';

const getInitials = (firstName, lastName) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return '?';
};

const ProfileScreen = ({
    profile,
    role,
    stats,
    hikeLog,
    onSettingsPress,
    onLikeReview,
    isLiked,
    onEditReview,
    onGroupPress
}) => {

    const [activeTab, setActiveTab] = useState('Milestones');
    
    const { isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth = isDesktop ? 800 : (isTablet ? 650 : '100%');
    const responsiveAlignStyle = { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' };

    const userName = profile?.firstname 
        ? `${profile.firstname} ${profile.lastname}` 
        : 'User Name';
    
    const userHandle = profile?.username 
        ? `@${profile.username}` 
        : '@username';

    const createdDate = profile?.createdAt 
        ? formatDate(profile.createdAt) 
        : 'Mar 2026';

    const userInitials = getInitials(profile?.firstname, profile?.lastname);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Profile"
                showDefaultIcons={true} 
                style={styles.transparentHeader}
            />

            <ResponsiveScrollView 
                contentContainerStyle={styles.scrollContent}
                stickyHeaderIndices={[1]} 
            >
                <View style={[styles.userBanner, responsiveAlignStyle]}>
                    <View style={styles.userInfoLeft}>
                        <View style={styles.avatarPlaceholder}>
                            <CustomText style={styles.initialsText}>
                                {userInitials}
                            </CustomText>
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

                <View style={styles.stickyTabWrapper}>
                    <View style={[styles.floatingTabsContainer, responsiveAlignStyle]}>
                        
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
                
                <View style={[styles.tabContentContainer, responsiveAlignStyle]}>
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
                
            </ResponsiveScrollView>

            <CustomFAB onPress={onGroupPress} />

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
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    tabContentContainer: {
        flex: 1,
        marginBottom: 24,
    },
    userBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
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
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.WHITE,
    },
    initialsText: {
        color: Colors.WHITE,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1,
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
    stickyTabWrapper: {
        backgroundColor: Colors.BACKGROUND,
        paddingVertical: 12,
        zIndex: 10,
        alignItems: 'center', 
    },
    floatingTabsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        padding: 3,
        borderRadius: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    tabButtonActive: {
        backgroundColor: Colors.WHITE, 
        ...tabShadow, 
    },
    tabText: {
        fontSize: 14, 
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY, 
    },
    tabTextActive: {
        color: Colors.PRIMARY, 
        fontWeight: 'bold',
    }
});

export default ProfileScreen;