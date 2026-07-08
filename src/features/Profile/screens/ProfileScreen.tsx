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
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Review } from '@/src/core/models/Review/Review';
import { IUser, Role } from '@/src/core/models/User/User.types';
import { formatDate } from '@/src/core/utility/date';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

import HikeLogTab from '@/src/features/Profile/tabs/HikeLogTab';
import MilestonesTab from '@/src/features/Profile/tabs/MilestonesTab';

/**
 * Helper function to extract initials from a user's first and last name.
 * 
 * @param {string} firstName - The user's first name
 * @param {string} lastName - The user's last name
 * @returns {string} The extracted initials (1 or 2 characters)
 */
const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return '?';
};

/**
 * Props for the ProfileScreen component.
 */
export interface ProfileScreenProps {
    /** The authenticated user's profile data */
    profile?: IUser;
    /** The active role of the current user */
    role?: Role | null;
    /** Statistical milestones for the user */
    stats?: import('@/src/features/Profile/tabs/MilestonesTab').MilestonesTabProps['stats']; 
    /** An array of reviews/hikes the user has logged */
    hikeLog?: Review[];
    /** Callback for the settings gear icon */
    onSettingsPress: () => void;
    /** Callback when a review is liked */
    onLikeReview: (review: Review) => void;
    /** Helper to check if a review is liked by current user */
    isLiked: (review: Review) => boolean;
    /** Callback to edit a review */
    onEditReview: (id?: string) => void;
    /** Callback for FAB action */
    onGroupPress: () => void;
    /** Callback to view admin */
    onAdminPress?: () => void;
    /** Callback to view superadmin */
    onSuperadminPress?: () => void;
    /** Callback to apply for business */
    onApplyPress?: () => void;
    /** Callback to sign out */
    onSignOutPress?: () => void;
}

/**
 * Main Profile Screen displaying user information, milestones, and hike logs.
 */
const ProfileScreen = ({
    profile,
    role,
    stats,
    hikeLog,
    onSettingsPress,
    onLikeReview,
    isLiked,
    onEditReview,
    onGroupPress,
    onAdminPress,
    onSuperadminPress,
    onApplyPress,
    onSignOutPress
}: ProfileScreenProps) => {

    const [activeTab, setActiveTab] = useState<'Milestones' | 'Hike Log'>('Milestones');
    
    const { isDesktop, isTablet } = useBreakpoints();
    const contentMaxWidth: number | `${number}%` = isDesktop ? 800 : (isTablet ? 650 : '100%');
    const responsiveAlignStyle = { maxWidth: contentMaxWidth, alignSelf: 'center' as const, width: '100%' as const };

    const userName = profile?.firstname 
        ? `${profile.firstname} ${profile.lastname}` 
        : 'User Name';
    
    const userHandle = profile?.username 
        ? `@${profile.username}` 
        : '@username';

    let createdDate = 'Mar 2026';
    if (profile?.createdAt) {
        try {
            const rawDate: unknown = profile.createdAt;
            const dateObj = (rawDate as { toDate?: () => Date }).toDate?.() ?? new Date(rawDate as string | number | Date);

            if (!isNaN(dateObj.getTime())) {
                createdDate = formatDate(dateObj);
            }
        } catch (e) {
            console.warn("Date parse error", e);
        }
    }

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
                            <CustomIcon 
                                library="Ionicons" 
                                name="stats-chart" 
                                size={activeTab === 'Milestones' ? 22 : 20} 
                                color={activeTab === 'Milestones' ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                            />
                                
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
                            <CustomIcon 
                                library="Feather" 
                                name="edit-3" 
                                size={activeTab === 'Hike Log' ? 22 : 20} 
                                color={activeTab === 'Hike Log' ? Colors.PRIMARY : Colors.TEXT_SECONDARY} 
                            />
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
                            isLiked={(review) => Boolean(isLiked(review))}
                            onEditReview={(id: string) => onEditReview(id)}
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
    },
    android: {
...GlobalStyles.dropShadow(4),
    },
    web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    }
});

const styles = StyleSheet.create({
    transparentHeader: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
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
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'transparent',
        gap: 8,
    },
    tabButtonActive: {
        backgroundColor: Colors.WHITE, 
        ...tabShadow, 
    },
    tabText: {
        fontSize: 14, 
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
    tabTextActive: {
        color: Colors.PRIMARY, 
        fontWeight: 'bold',
    }
});

export default ProfileScreen;
