/**
 * @file MountainListScreen.tsx
 * @description Superadmin presentation tab screen for managing registered mountains in CALABARZON, equipped with SaaS metric cards, expandable search, auto-centering province tabs, compact toolbar add button, mobile header add button, edit/delete icon actions, and delete confirmation modal.
 */

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Mountain } from '@/src/core/models/Mountain/Mountain';
import MetricCard from '@/src/features/SuperAdmin/components/MetricCard';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminCard from '@/src/features/SuperAdmin/components/SuperadminCard';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import useMountainList from '@/src/features/SuperAdmin/hooks/useMountainList';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Props for the MountainListScreen component.
 */
export interface MountainListScreenProps {
    mountains: Mountain[];
    isLoading?: boolean;
    error?: string | null;
    pendingCount?: number;
    onTabPress: (tab: SuperadminTab) => void;
    onBackToSettings: () => void;
    onWritePress: (id?: string) => void;
}

const PROVINCE_TABS = ['All', 'Batangas', 'Rizal', 'Cavite', 'Laguna', 'Quezon'];

/**
 * Superadmin presentation screen for managing mountains.
 */
const MountainListScreen: React.FC<MountainListScreenProps> = ({
    mountains = [],
    isLoading = false,
    error = null,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
    onWritePress,
}) => {
    const { isDesktop, isMobile } = useBreakpoints();

    const {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredMountains,
        metrics,
    } = useMountainList(mountains);

    return (
        <SuperadminShell
            activeTab="mountain"
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettings}
            enableSearch={true}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search mountain..."
        >
            <View style={styles.container}>
                {/* Platform Metrics SaaS Card Bar */}
                <MetricCard
                    metrics={[
                        {
                            title: 'Total Mountains',
                            count: metrics.total,
                            icon: 'mountain',
                            library: 'FontAwesome5',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Provinces Covered',
                            count: metrics.provincesCovered,
                            icon: 'map-pin',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Top Province',
                            count: metrics.topProvinceCount,
                            subtitle: metrics.topProvince ? metrics.topProvince : undefined,
                            icon: 'award',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Active Trails',
                            count: metrics.activeTrails,
                            icon: 'navigation',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                    ]}
                />

                {/* Filter Tabs & Add Button Row */}
                <View style={styles.filterAndActionRow}>
                    <CustomFilterTabs
                        tabs={PROVINCE_TABS}
                        activeTab={activeTab}
                        onTabSelect={setActiveTab}
                        variant="pill"
                        containerStyle={styles.chipContainerFlex}
                    />
                    
                    <View style={styles.actionContainer}>
                        {isMobile ? (
                            <TouchableOpacity
                                style={styles.mobileAddIconButton}
                                onPress={() => onWritePress()}
                                activeOpacity={0.7}
                            >
                                <CustomIcon library="Feather" name="plus" size={20} color={Colors.WHITE} />
                            </TouchableOpacity>
                        ) : (
                            <CustomButton
                                title="+ Add Mountain"
                                onPress={() => onWritePress()}
                                style={styles.desktopCompactAddButton}
                            />
                        )}
                    </View>
                </View>

                {/* Responsive Mountain Cards Grid / Stack */}
                {filteredMountains.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <CustomIcon library="FontAwesome5" name="mountain" size={40} color={Colors.GRAY_MEDIUM} />
                        <CustomText variant="h2" style={styles.emptyStateTitle}>
                            No Mountains Found
                        </CustomText>
                        <CustomText variant="caption" style={styles.emptyStateSubtitle}>
                            {searchQuery
                                ? `No mountain matching "${searchQuery}" was found.`
                                : 'No mountain records have been registered yet.'}
                        </CustomText>
                    </View>
                ) : (
                    <View style={styles.cardGrid}>
                        {filteredMountains.map((mountain) => {
                            const provinces: string[] = Array.isArray(mountain.province)
                                ? mountain.province.map((p: string | { name?: string }) => (typeof p === 'string' ? p : p?.name || ''))
                                : [];

                            const tags = provinces.map((prov) => ({
                                label: prov,
                                bgColor: Colors.STATUS_APPROVED_BG,
                                textColor: Colors.STATUS_APPROVED_TEXT,
                                borderColor: Colors.STATUS_APPROVED_BORDER,
                            }));

                            return (
                                <SuperadminCard
                                    key={mountain.id}
                                    iconName="mountain"
                                    iconLibrary="FontAwesome5"
                                    iconColor={Colors.ROLE_AVATAR_TEXT}
                                    iconBgColor={Colors.ROLE_AVATAR_BG}
                                    title={mountain.name || 'Unnamed Mountain'}
                                    subtitle={`ID: ${mountain.id}`}
                                    headerAction={{
                                        icon: 'edit-2',
                                        library: 'Feather',
                                        color: Colors.PRIMARY,
                                        onPress: () => onWritePress(mountain.id),
                                    }}
                                    tagsHeader={{
                                        icon: 'map-pin',
                                        label: 'Province:',
                                    }}
                                    tags={
                                        tags.length > 0
                                            ? tags
                                            : [
                                                  {
                                                      label: 'Unassigned',
                                                      bgColor: Colors.BACKGROUND,
                                                      textColor: Colors.TEXT_SECONDARY,
                                                      borderColor: Colors.GRAY_LIGHT,
                                                  },
                                              ]
                                    }
                                    isDesktop={isDesktop}
                                />
                            );
                        })}
                    </View>
                )}
            </View>

        </SuperadminShell>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    filterAndActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 16,
    },
    actionContainer: {
        flexShrink: 0,
    },
    mobileAddIconButton: {
        backgroundColor: Colors.PRIMARY,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...GlobalStyles.dropShadow(2),
    },
    chipContainerFlex: {
        flex: 1,
    },
    desktopCompactAddButton: {
        height: 40,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    emptyStateContainer: {
        paddingVertical: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        gap: 8,
    },
    emptyStateTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        color: Colors.TEXT_PRIMARY,
        marginTop: 8,
    },
    emptyStateSubtitle: {
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
    },
    cardGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
});

export default MountainListScreen;
