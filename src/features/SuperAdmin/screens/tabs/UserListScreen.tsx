/**
 * @file UserListScreen.tsx
 * @description Superadmin presentation screen for managing user accounts, equipped with unified SaaS metric cards, expandable header search, auto-centering role filter tabs with drag-scroll/fade indicators, solid initial-based avatars, and 3-column web grid layout.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomIcon from '@/src/components/CustomIcon';
import CustomLoading from '@/src/components/CustomLoading';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { User } from '@/src/core/models/User/User';
import { formatDate } from '@/src/core/utility/date';
import MetricCard from '@/src/features/SuperAdmin/components/MetricCard';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminCard from '@/src/features/SuperAdmin/components/SuperadminCard';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import useUserList, { RoleFilter } from '@/src/features/SuperAdmin/hooks/useUserList';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Props for the UserListScreen component.
 * 
 * @param users - List of user domain objects from Firestore repository.
 * @param isLoading - Loading indicator state during asynchronous data retrieval.
 * @param error - Error message string if data retrieval encounters a failure.
 * @param pendingCount - Count of pending applications for sidebar badges.
 * @param onTabPress - Handler invoked when clicking sidebar tabs inside SuperadminShell.
 * @param onBackToSettings - Handler invoked to navigate back to Settings/Profile screen.
 */
export interface UserListScreenProps {
    users?: User[];
    isLoading?: boolean;
    error?: string | null;
    pendingCount?: number;
    onTabPress: (tab: SuperadminTab) => void;
    onBackToSettings: () => void;
}

const ROLE_TABS: RoleFilter[] = ['All', 'Hikers', 'Admins', 'Superadmins'];

/**
 * Superadmin presentation screen for viewing, filtering, and searching user accounts.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} Rendered user account management screen inside SuperadminShell.
 */
const UserListScreen: React.FC<UserListScreenProps> = ({
    users = [],
    isLoading = false,
    error = null,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
}) => {
    const { isDesktop, isTablet } = useBreakpoints();

    const {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredUsers,
        metrics,
    } = useUserList(users);

    // Red & Green Semantic Role Colors (Matching ProfileInfoScreen.tsx)
    const getRoleBadgeStyle = (role?: string) => {
        switch (role) {
            case 'superadmin':
                return {
                    bg: Colors.ROLE_SUPERADMIN_BG,
                    text: Colors.ROLE_SUPERADMIN_TEXT,
                    label: 'Superadmin',
                };
            case 'admin':
                return {
                    bg: Colors.ROLE_ADMIN_BG,
                    text: Colors.ROLE_ADMIN_TEXT,
                    label: 'Admin',
                };
            case 'user':
            default:
                return {
                    bg: Colors.ROLE_HIKER_BG,
                    text: Colors.ROLE_HIKER_TEXT,
                    label: 'Hiker',
                };
        }
    };

    return (
        <SuperadminShell
            activeTab="user"
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettings}
            enableSearch={true}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search user..."
        >
            <View style={styles.container}>
                {/* Platform Metrics SaaS Card (Clean 2-line cards with zero bottom subtitle rows) */}
                <MetricCard
                    metrics={[
                        {
                            title: 'Total Users',
                            count: metrics.total,
                            icon: 'users',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Hikers',
                            count: metrics.hikers,
                            icon: 'user-check',
                            library: 'Feather',
                            color: Colors.ROLE_HIKER_BG,
                        },
                        {
                            title: 'Tour Admins',
                            count: metrics.admins,
                            icon: 'briefcase',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Superadmins',
                            count: metrics.superadmins,
                            icon: 'shield',
                            library: 'Feather',
                            color: Colors.ROLE_SUPERADMIN_BG,
                        },
                    ]}
                />

                {/* Category Role Filter Tabs with CustomFilterTabs */}
                <CustomFilterTabs
                    tabs={ROLE_TABS}
                    activeTab={activeTab}
                    onTabSelect={(tab) => setActiveTab(tab as RoleFilter)}
                    variant="pill"
                />

                {/* Error Banner */}
                {error ? (
                    <View style={styles.statusWrapper}>
                        <ErrorMessage error={error} />
                    </View>
                ) : null}

                {/* Loading Spinner */}
                {isLoading ? (
                    <View style={styles.statusWrapper}>
                        <CustomLoading />
                    </View>
                ) : null}

                {/* User Cards Grid (3 Columns Desktop, 2 Columns Tablet, 1 Column Mobile - Fixed Card Widths) */}
                {!isLoading && (
                    <View style={[
                        styles.userGrid,
                        isTablet && styles.userGridTablet,
                        isDesktop && styles.userGridDesktop,
                    ]}>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => {
                                const badge = getRoleBadgeStyle(u.role);
                                const displayName =
                                    `${u.firstname || ''} ${u.lastname || ''}`.trim() ||
                                    u.username ||
                                    'Unnamed User';

                                const initials = getInitials(displayName);

                                return (
                                    <SuperadminCard
                                        key={u.id}
                                        avatarText={initials}
                                        title={displayName}
                                        subtitle={u.username ? `@${u.username}` : 'No username set'}
                                        statusBadge={{
                                            label: badge.label,
                                            bgColor: badge.bg,
                                            textColor: badge.text,
                                        }}
                                        infoRows={[
                                            { icon: 'mail', label: 'Email:', value: u.email || 'No email registered' },
                                            { icon: 'phone', label: 'Phone:', value: u.phoneNumber || 'No phone number provided' },
                                            { icon: 'calendar', label: 'Joined:', value: u.createdAt ? formatDate(u.createdAt) : 'Date unavailable' },
                                            { icon: 'hash', label: 'ID:', value: u.id || 'N/A' },
                                        ]}
                                        isTablet={isTablet}
                                        isDesktop={isDesktop}
                                    />
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <CustomIcon library="Feather" name="user-x" size={48} color={Colors.GRAY_MEDIUM} />
                                <CustomText variant="h3" style={styles.emptyTitle}>
                                    No User Accounts Found
                                </CustomText>
                                <CustomText variant="caption" style={styles.emptySubtitle}>
                                    {searchQuery
                                        ? `No matching users found for "${searchQuery}".`
                                        : `No user accounts found under category "${activeTab}".`}
                                </CustomText>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </SuperadminShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 16,
    },
    statusWrapper: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        width: '100%',
    },
    userGridTablet: {
        gap: 16,
    },
    userGridDesktop: {
        gap: 16,
    },
    userCard: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        minHeight: 185,
        justifyContent: 'space-between',
        ...GlobalStyles.dropShadow(2),
    },
    userCardTablet: {
        width: 'calc(50% - 8px)' as unknown as number,
    },
    userCardDesktop: {
        width: 'calc(33.333% - 11px)' as unknown as number,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.ROLE_AVATAR_BG,
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.ROLE_AVATAR_TEXT,
    },
    userInfoCol: {
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    userHandle: {
        color: Colors.TEXT_SECONDARY,
    },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleBadgeText: {
        fontWeight: 'bold',
        fontSize: 11,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        marginVertical: 10,
    },
    cardBody: {
        gap: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        color: Colors.TEXT_SECONDARY,
        flexShrink: 1,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 12,
        width: '100%',
    },
    emptyTitle: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    emptySubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
});

export default UserListScreen;
