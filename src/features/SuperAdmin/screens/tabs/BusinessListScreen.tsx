/**
 * @file BusinessListScreen.tsx
 * @description Superadmin presentation screen for managing tour business accounts, equipped with unified SaaS metric cards, expandable header search, status filter tabs, spinning reload animation, mobile pull-to-refresh, initial-based business avatars, structured permit details, and 3-column web grid layout.
 */

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Business } from '@/src/core/models/Business/Business';
import { formatDate } from '@/src/core/utility/date';
import MetricCard from '@/src/features/SuperAdmin/components/MetricCard';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminCard from '@/src/features/SuperAdmin/components/SuperadminCard';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import { useBusinessList, BusinessStatusFilter } from '@/src/features/SuperAdmin/hooks/useBusinessList';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Props for the BusinessListScreen component.
 * 
 * @param businesses - List of business domain objects from Firestore repository.
 * @param isLoading - Loading indicator state during asynchronous data retrieval.
 * @param error - Error message string if data retrieval encounters a failure.
 * @param pendingCount - Count of pending applications for sidebar badges.
 * @param onTabPress - Handler invoked when clicking sidebar tabs inside SuperadminShell.
 * @param onBackToSettings - Handler invoked to navigate back to Settings/Profile screen.
 * @param onDeletePress - Handler invoked when confirming business deletion/archiving.
 * @param reloadBusinesses - Handler invoked to manually reload business data.
 */
export interface BusinessListScreenProps {
    businesses?: Business[];
    isLoading?: boolean;
    error?: string | null;
    pendingCount?: number;
    onTabPress: (tab: SuperadminTab) => void;
    onBackToSettings: () => void;
    onDeletePress: (id: string) => void;
    reloadBusinesses: () => void;
}

const STATUS_TABS: BusinessStatusFilter[] = ['All', 'Active', 'Archived'];

/**
 * Superadmin presentation screen for viewing, filtering, and managing tour businesses.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} Rendered tour business management screen inside SuperadminShell.
 */
const BusinessListScreen: React.FC<BusinessListScreenProps> = ({
    businesses = [],
    isLoading = false,
    error = null,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
    onDeletePress,
    reloadBusinesses,
}) => {
    const { isDesktop, isTablet } = useBreakpoints();
    const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
    const [deletingBusinessName, setDeletingBusinessName] = useState<string>('');

    // Spinning animation & pull-to-refresh state
    const [isReloading, setIsReloading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [spinAnim] = useState(() => new Animated.Value(0));

    const {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredBusinesses,
        metrics,
    } = useBusinessList(businesses);

    // Spin animation control
    const startSpin = () => {
        spinAnim.setValue(0);
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    };

    const stopSpin = () => {
        spinAnim.stopAnimation();
        spinAnim.setValue(0);
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleManualReload = async () => {
        if (isReloading) return;
        setIsReloading(true);
        startSpin();
        const minAnimationDuration = new Promise((resolve) => setTimeout(resolve, 700));
        try {
            await Promise.all([reloadBusinesses(), minAnimationDuration]);
        } finally {
            stopSpin();
            setIsReloading(false);
        }
    };

    const handlePullRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await reloadBusinesses();
        } finally {
            setRefreshing(false);
        }
    }, [reloadBusinesses]);

    const handleOpenDeleteModal = (id: string, name: string) => {
        setDeletingBusinessId(id);
        setDeletingBusinessName(name);
    };

    const handleConfirmDelete = () => {
        if (deletingBusinessId) {
            onDeletePress(deletingBusinessId);
            setDeletingBusinessId(null);
            setDeletingBusinessName('');
        }
    };

    return (
        <SuperadminShell
            activeTab="business"
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettings}
            enableSearch={true}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search businesses..."
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handlePullRefresh}
                    colors={[Colors.PRIMARY]}
                    tintColor={Colors.PRIMARY}
                />
            }
        >
            <View style={styles.container}>
                
                {/* SaaS Metric Overview Cards */}
                <MetricCard
                    metrics={[
                        {
                            title: 'Total Businesses',
                            count: metrics.total,
                            icon: 'briefcase',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Active Businesses',
                            count: metrics.active,
                            icon: 'check-circle',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Archived Businesses',
                            count: metrics.archived,
                            icon: 'archive',
                            library: 'Feather',
                            color: Colors.GRAY_MEDIUM,
                        },
                    ]}
                />

                {/* Filter & Actions Bar */}
                <View style={styles.filterBarRow}>
                    <View style={styles.filterTabsWrapper}>
                        <CustomFilterTabs
                            tabs={STATUS_TABS}
                            activeTab={activeTab}
                            onTabSelect={(tab) => setActiveTab(tab as BusinessStatusFilter)}
                            variant="pill"
                        />
                    </View>

                    <Pressable
                        onPress={handleManualReload}
                        disabled={isReloading}
                        style={({ hovered }: { hovered?: boolean }) => [
                            styles.reloadBtn,
                            hovered ? styles.reloadBtnHovered : null,
                            isReloading ? styles.reloadBtnDisabled : null,
                        ]}
                    >
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <CustomIcon library="Feather" name="refresh-cw" size={14} color={Colors.PRIMARY} />
                        </Animated.View>
                        <CustomText variant="caption" style={styles.reloadBtnText}>
                            {isReloading ? 'Reloading...' : 'Reload'}
                        </CustomText>
                    </Pressable>
                </View>

                {/* Error Banner */}
                {error ? (
                    <View style={styles.statusWrapper}>
                        <ErrorMessage error={error} />
                    </View>
                ) : null}

                {/* Loading Spinner */}
                {(isLoading || isReloading) && !refreshing ? (
                    <View style={styles.statusWrapper}>
                        <ActivityIndicator size="large" color={Colors.PRIMARY} />
                    </View>
                ) : null}

                {/* Businesses Cards Grid */}
                {!isLoading && !isReloading && (
                    <View
                        style={[
                            styles.businessGrid,
                            isTablet ? styles.businessGridTablet : null,
                            isDesktop ? styles.businessGridDesktop : null,
                        ]}
                    >
                        {filteredBusinesses.length > 0 ? (
                            filteredBusinesses.map((b) => {
                                const initials = getInitials(b.name || 'Business');
                                const isActive = b.active === true;

                                const infoRows = [
                                    { icon: 'hash', label: 'ID:', value: b.id },
                                    { icon: 'map-pin', label: 'Address:', value: b.address || 'No address provided' },
                                ];
                                if (b.owner?.email) {
                                    infoRows.push({ icon: 'mail', label: 'Email:', value: b.owner.email });
                                }
                                if (b.establishedOn) {
                                    infoRows.push({ icon: 'calendar', label: 'Established:', value: formatDate(b.establishedOn) });
                                }
                                if (b.servicedLocation && b.servicedLocation.length > 0) {
                                    infoRows.push({ icon: 'map', label: 'Serviced:', value: b.servicedLocation.join(', ') });
                                }

                                const tags = [];
                                if (b.permits?.bir) tags.push({ label: 'BIR Verified' });
                                if (b.permits?.denr) tags.push({ label: 'DENR Verified' });
                                if (b.permits?.dti) tags.push({ label: 'DTI Verified' });

                                return (
                                    <SuperadminCard
                                        key={b.id}
                                        avatarText={initials}
                                        avatarBgColor={isActive ? Colors.ROLE_AVATAR_BG : Colors.GRAY_LIGHT}
                                        avatarTextColor={isActive ? Colors.ROLE_AVATAR_TEXT : Colors.TEXT_SECONDARY}
                                        title={b.name || 'Unnamed Business'}
                                        subtitle={`Owner: ${b.owner?.name || 'N/A'}`}
                                        statusBadge={{
                                            label: isActive ? 'Active' : 'Archived',
                                            bgColor: isActive ? Colors.ROLE_HIKER_BG : Colors.GRAY_LIGHT,
                                            textColor: isActive ? Colors.ROLE_HIKER_TEXT : Colors.TEXT_SECONDARY,
                                        }}
                                        infoRows={infoRows}
                                        tags={tags}
                                        footerAction={isActive ? {
                                            label: 'Archive Business',
                                            icon: 'trash-2',
                                            color: Colors.ERROR,
                                            hoverBgColor: Colors.ERROR_BG,
                                            onPress: () => handleOpenDeleteModal(b.id, b.name),
                                        } : undefined}
                                        isTablet={isTablet}
                                        isDesktop={isDesktop}
                                    />
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <CustomIcon library="Feather" name="briefcase" size={48} color={Colors.GRAY_MEDIUM} />
                                <CustomText variant="h3" style={styles.emptyTitle}>
                                    No Businesses Found
                                </CustomText>
                                <CustomText variant="caption" style={styles.emptySubtitle}>
                                    {searchQuery
                                        ? `No business matching "${searchQuery}" was found.`
                                        : `No tour businesses found under status "${activeTab}".`}
                                </CustomText>
                            </View>
                        )}
                    </View>
                )}

                {/* Archive / Delete Confirmation Modal */}
                <ConfirmationModal
                    visible={!!deletingBusinessId}
                    title="Archive Business"
                    message={`Are you sure you want to archive "${deletingBusinessName}"? The business will be set to inactive status.`}
                    confirmText="Archive"
                    cancelText="Cancel"
                    isDestructive={true}
                    iconName="trash-2"
                    onConfirm={handleConfirmDelete}
                    onClose={() => setDeletingBusinessId(null)}
                />
            </View>
        </SuperadminShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 16,
    },
    filterBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    filterTabsWrapper: {
        flex: 1,
    },
    reloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    reloadBtnHovered: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    reloadBtnDisabled: {
        opacity: 0.6,
    },
    reloadBtnText: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    statusWrapper: {
        paddingVertical: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    businessGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        width: '100%',
    },
    businessGridTablet: {
        gap: 16,
    },
    businessGridDesktop: {
        gap: 16,
    },
    businessCard: {
        width: '100%',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        minHeight: 220,
        justifyContent: 'space-between',
        ...GlobalStyles.dropShadow(2),
    },
    businessCardTablet: {
        width: 'calc(50% - 8px)' as unknown as number,
    },
    businessCardDesktop: {
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
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    businessInfoCol: {
        flex: 1,
    },
    businessName: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    ownerText: {
        color: Colors.TEXT_SECONDARY,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
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
    permitsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    permitBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    permitBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.STATUS_APPROVED_TEXT,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_LIGHT,
        alignItems: 'flex-end',
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    deleteBtnHovered: {
        backgroundColor: Colors.ERROR_BG,
    },
    deleteBtnText: {
        color: Colors.ERROR,
        fontWeight: 'bold',
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

export default BusinessListScreen;
