/**
 * @file Sidebar.tsx
 * @description Collapsible left sidebar navigation component for Superadmin Dashboard with active item highlights, pending request badges, repositioned minimize button, exact top padding, and avatar footer.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { useAuthStore } from '@/src/core/stores/authStores/authStore';
import { IconLibrary } from '@/src/types/ui.types';
import { getInitials } from '@/src/utils/dateFormatter';

export type SuperadminTab = 'dashboard' | 'application' | 'business' | 'trail' | 'mountain' | 'user';
export type AdminTab = SuperadminTab;

/**
 * Interface representing the properties of the Sidebar component.
 * 
 * @param activeTab - The currently selected active tab identifier.
 * @param pendingCount - Count of pending applications.
 * @param onTabPress - Callback handler when a navigation item is pressed.
 * @param onBackToSettings - Callback handler to return to Settings/Profile screen.
 * @param isMobileDrawer - Flag indicating if sidebar is rendering inside a mobile drawer.
 * @param onCloseMobileDrawer - Callback handler to close mobile drawer.
 */
interface Props {
    activeTab: SuperadminTab;
    pendingCount: number;
    onTabPress: (tab: SuperadminTab) => void;
    onBackToSettings: () => void;
    isMobileDrawer?: boolean;
    onCloseMobileDrawer?: () => void;
}

interface NavItemConfig {
    id: SuperadminTab;
    label: string;
    icon: string;
    library: IconLibrary;
}

interface NavSection {
    title?: string;
    items: NavItemConfig[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'MAIN',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'grid', library: 'Feather' },
            { id: 'application', label: 'Applications', icon: 'file-text', library: 'Feather' },
        ],
    },
    {
        title: 'MANAGEMENT',
        items: [
            { id: 'business', label: 'Tour Businesses', icon: 'briefcase', library: 'Feather' },
            { id: 'trail', label: 'Trails & Routes', icon: 'map', library: 'Feather' },
            { id: 'mountain', label: 'Mountains Database', icon: 'mountain', library: 'FontAwesome5' },
            { id: 'user', label: 'User Accounts', icon: 'users', library: 'Feather' },
        ],
    },
];

let globalSidebarCollapsed = false;
const sidebarListeners = new Set<(collapsed: boolean) => void>();

export const setGlobalSidebarCollapsed = (collapsed: boolean) => {
    globalSidebarCollapsed = collapsed;
    sidebarListeners.forEach(listener => listener(collapsed));
};

/**
 * Sidebar component rendering left navigation and bottom profile section.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered collapsible sidebar navigation component.
 */
const Sidebar = ({
    activeTab,
    pendingCount,
    onTabPress,
    onBackToSettings,
    isMobileDrawer = false,
    onCloseMobileDrawer,
}: Props): React.JSX.Element => {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(globalSidebarCollapsed);
    const animatedWidth = useRef(new Animated.Value(globalSidebarCollapsed ? 68 : 240)).current;
    const isFirstRender = useRef(true);

    const effectiveCollapsed = isMobileDrawer ? false : isCollapsed;

    // Fetch real authenticated user profile & role
    const profile = useAuthStore(s => s.profile);
    const role = useAuthStore(s => s.role);

    const fullName = profile ? `${profile.firstname || ''} ${profile.lastname || ''}`.trim() : '';
    const displayName = fullName || profile?.username || 'SuperAdmin';
    const initials = getInitials(displayName !== 'SuperAdmin' ? displayName : 'SA');
    const roleTitle = role === 'superadmin' 
        ? 'System Administrator' 
        : role === 'admin' 
            ? 'Business Admin' 
            : 'Administrator';

    useEffect(() => {
        const handleGlobalChange = (nextCollapsed: boolean) => {
            setIsCollapsed(nextCollapsed);
        };
        sidebarListeners.add(handleGlobalChange);
        return () => {
            sidebarListeners.delete(handleGlobalChange);
        };
    }, []);

    useEffect(() => {
        if (!isMobileDrawer) {
            const targetWidth = isCollapsed ? 68 : 240;
            if (isFirstRender.current) {
                isFirstRender.current = false;
                animatedWidth.setValue(targetWidth);
            } else {
                Animated.timing(animatedWidth, {
                    toValue: targetWidth,
                    duration: 200,
                    useNativeDriver: false,
                }).start();
            }
        }
    }, [isCollapsed, isMobileDrawer, animatedWidth]);

    const toggleCollapse = () => {
        setGlobalSidebarCollapsed(!isCollapsed);
    };

    return (
        <Animated.View 
            style={[
                styles.sidebar, 
                isMobileDrawer 
                    ? styles.sidebarMobile 
                    : { width: animatedWidth }
            ]}
        >
            {/* Top Brand Header */}
            <View style={[styles.brandHeader, effectiveCollapsed && styles.brandHeaderCollapsed]}>
                <View style={[styles.logoRow, effectiveCollapsed && styles.logoRowCollapsed]}>
                    <View style={styles.logoBadge}>
                        <CustomIcon library="FontAwesome5" name="mountain" size={14} color={Colors.WHITE} />
                    </View>

                    {!effectiveCollapsed && (
                        <View style={styles.brandTextWrapper}>
                            <CustomText variant="body" style={styles.brandTitle} numberOfLines={1}>
                                Thrail App
                            </CustomText>
                            <CustomText variant="caption" style={styles.brandSubtitle} numberOfLines={1}>
                                Superadmin Panel
                            </CustomText>
                        </View>
                    )}
                </View>

                {/* Close Button on Mobile Drawer */}
                {isMobileDrawer && onCloseMobileDrawer ? (
                    <TouchableOpacity
                        style={styles.closeDrawerBtn}
                        onPress={onCloseMobileDrawer}
                        activeOpacity={0.7}
                    >
                        <CustomIcon library="Feather" name="x" size={18} color={Colors.TEXT_PRIMARY} />
                    </TouchableOpacity>
                ) : null}

                {/* Desktop Minimize Toggle Button (Combined in same header row when expanded) */}
                {!isMobileDrawer && !effectiveCollapsed && (
                    <TouchableOpacity 
                        style={styles.minimizeBtn} 
                        onPress={toggleCollapse}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="sidebar" 
                            size={16} 
                            color={Colors.PRIMARY} 
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Desktop Minimize Button below logo when Collapsed */}
            {!isMobileDrawer && effectiveCollapsed && (
                <View style={styles.minimizeRowCollapsed}>
                    <TouchableOpacity 
                        style={styles.minimizeBtn} 
                        onPress={toggleCollapse}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="sidebar" 
                            size={16} 
                            color={Colors.TEXT_SECONDARY} 
                        />
                    </TouchableOpacity>
                </View>
            )}

            {/* Navigation List grouped by Sections */}
            <View style={styles.navList}>
                {NAV_SECTIONS.map((section, sIndex) => (
                    <View key={section.title || sIndex} style={styles.sectionGroup}>
                        {/* Section Category Subtitle */}
                        {!effectiveCollapsed && section.title ? (
                            <View style={styles.sectionHeaderContainer}>
                                <CustomText variant="caption" style={styles.sectionTitleText}>
                                    {section.title}
                                </CustomText>
                            </View>
                        ) : effectiveCollapsed && sIndex > 0 ? (
                            <View style={styles.sectionDivider} />
                        ) : null}

                        {/* Section Items */}
                        {section.items.map((item) => {
                            const isActive = activeTab === item.id;
                            const isAppTab = item.id === 'application';
                            const hasPending = isAppTab && pendingCount > 0;

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.navItem,
                                        isActive && styles.navItemActive,
                                        hasPending && !isActive && styles.navItemPendingHighlight,
                                        effectiveCollapsed && styles.navItemCollapsed,
                                    ]}
                                    onPress={() => {
                                        onTabPress(item.id);
                                        if (isMobileDrawer && onCloseMobileDrawer) {
                                            onCloseMobileDrawer();
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.navIconWrapper}>
                                        <CustomIcon
                                            library={item.library}
                                            name={item.icon}
                                            size={18}
                                            color={
                                                isActive 
                                                    ? Colors.PRIMARY 
                                                    : hasPending 
                                                        ? Colors.ERROR 
                                                        : Colors.TEXT_SECONDARY
                                            }
                                        />
                                    </View>

                                    {!effectiveCollapsed && (
                                        <CustomText
                                            variant="body"
                                            style={[
                                                styles.navLabel,
                                                isActive && styles.navLabelActive,
                                                hasPending && !isActive && styles.navLabelPending,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {item.label}
                                        </CustomText>
                                    )}

                                    {/* Pending Count Badge */}
                                    {hasPending && (
                                        <View style={styles.pendingBadge}>
                                            <CustomText style={styles.pendingBadgeText}>
                                                {pendingCount}
                                            </CustomText>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Bottom Profile Footer */}
            <View style={styles.profileFooter}>
                {isMobileDrawer ? (
                    /* Mobile Drawer Layout: Avatar + Name/Role on left, compact Settings icon on right */
                    <View style={styles.profileMobileRow}>
                        <View style={styles.profileInfoRow}>
                            <View style={styles.avatarCircle}>
                                <CustomText style={styles.avatarText}>{initials}</CustomText>
                            </View>
                            <View style={styles.profileTextWrapper}>
                                <CustomText variant="body" style={styles.profileName} numberOfLines={1}>
                                    {displayName}
                                </CustomText>
                                <CustomText variant="caption" style={styles.profileRole} numberOfLines={1}>
                                    {roleTitle}
                                </CustomText>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.minimizeBtn}
                            onPress={onBackToSettings}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="settings" size={16} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* Desktop Sidebar Layout: Stacked profile + button (collapsed or expanded) */
                    <>
                        <View style={[styles.profileInfoRow, effectiveCollapsed && styles.profileInfoRowCollapsed]}>
                            <View style={styles.avatarCircle}>
                                <CustomText style={styles.avatarText}>{initials}</CustomText>
                            </View>

                            {!effectiveCollapsed && (
                                <View style={styles.profileTextWrapper}>
                                    <CustomText variant="body" style={styles.profileName} numberOfLines={1}>
                                        {displayName}
                                    </CustomText>
                                    <CustomText variant="caption" style={styles.profileRole} numberOfLines={1}>
                                        {roleTitle}
                                    </CustomText>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.backToSettingsBtn, effectiveCollapsed && styles.backToSettingsBtnCollapsed]}
                            onPress={onBackToSettings}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="settings" size={14} color={Colors.PRIMARY} />
                            {!effectiveCollapsed && (
                                <CustomText variant="caption" style={styles.backToSettingsText} numberOfLines={1}>
                                    Back to Settings
                                </CustomText>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sidebar: {
        height: '100%',
        backgroundColor: Colors.WHITE,
        borderRightWidth: 1,
        borderRightColor: Colors.GRAY_LIGHT,
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 16,
        justifyContent: 'space-between',
        ...GlobalStyles.dropShadow(1),
        elevation: 0,
    },
    sidebarMobile: {
        width: '100%',
        borderRightWidth: 0,
        elevation: 0,
    },
    brandHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    brandHeaderCollapsed: {
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoRowCollapsed: {
        justifyContent: 'center',
    },
    logoBadge: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandTextWrapper: {
        flex: 1,
    },
    brandTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    brandSubtitle: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 11,
    },
    minimizeRow: {
        alignItems: 'flex-end',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    minimizeRowCollapsed: {
        alignItems: 'center',
        marginBottom: 16,
    },
    minimizeBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: Colors.BACKGROUND,
    },
    closeDrawerBtn: {
        padding: 6,
        borderRadius: 6,
        backgroundColor: Colors.BACKGROUND,
    },
    navList: {
        flex: 1,
        gap: 12,
    },
    sectionGroup: {
        gap: 4,
    },
    sectionHeaderContainer: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 4,
    },
    sectionTitleText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.TEXT_SECONDARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    sectionDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 6,
        marginHorizontal: 8,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 12,
    },
    navItemCollapsed: {
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    navItemActive: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
    },
    navItemPendingHighlight: {
        backgroundColor: Colors.ERROR_BG,
    },
    navIconWrapper: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: 13,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
        flex: 1,
    },
    navLabelActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    navLabelPending: {
        color: Colors.ERROR,
        fontWeight: 'bold',
    },
    pendingBadge: {
        backgroundColor: Colors.ERROR,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    pendingBadgeText: {
        color: Colors.WHITE,
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileFooter: {
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
        paddingTop: 16,
        gap: 12,
    },
    profileInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    profileMobileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    profileInfoRowCollapsed: {
        justifyContent: 'center',
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 13,
    },
    profileTextWrapper: {
        flex: 1,
    },
    profileName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    profileRole: {
        fontSize: 11,
        color: Colors.TEXT_SECONDARY,
    },
    backToSettingsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.BACKGROUND,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 8,
    },
    backToSettingsBtnCollapsed: {
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    backToSettingsText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontSize: 11,
    },
});

export default Sidebar;
