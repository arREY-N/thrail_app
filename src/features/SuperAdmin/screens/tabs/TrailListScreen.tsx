/**
 * @file TrailListScreen.tsx
 * @description Role-adaptive presentation screen for managing trails and routes in CALABARZON. Adapts layout between SuperadminShell (with persistent sidebar) and Admin ScreenWrapper + CustomHeader to prevent sidebar routing errors for Admin users.
 */

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';


import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { Trail } from '@/src/core/models/Trail/Trail';
import MetricCard from '@/src/features/SuperAdmin/components/MetricCard';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import TrailCard from '@/src/features/SuperAdmin/components/TrailCard';
import useTrailList from '@/src/features/SuperAdmin/hooks/useTrailList';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

/**
 * Interface representing the properties of the TrailListScreen component.
 * 
 * @param trails - Array of Trail domain objects to display.
 * @param isLoading - Flag indicating whether data is loading.
 * @param error - Error message string if data fetching failed.
 * @param pendingCount - Count of pending applications.
 * @param onTabPress - Callback handler when navigating to a sidebar tab.
 * @param onBackToSettings - Callback handler to navigate back to settings or previous screen.
 * @param onViewTrail - Callback handler when previewing a trail.
 * @param onWriteTrail - Callback handler when creating or editing trail info.
 * @param onEditMapPins - Callback handler when editing map pins for a trail.
 * @param isSuperadminShell - Optional flag forcing SuperadminShell layout context. Defaults to true.
 */
export interface TrailListScreenProps {
    trails: Trail[];
    isLoading?: boolean;
    error?: string | null;
    pendingCount?: number;
    onTabPress: (tab: SuperadminTab) => void;
    onBackToSettings: () => void;
    onViewTrail: (id: string) => void;
    onWriteTrail: (id?: string | null) => void;
    onEditMapPins: (id: string) => void;
    isSuperadminShell?: boolean;
}

const PROVINCE_TABS = ['All', 'Batangas', 'Rizal', 'Cavite', 'Laguna', 'Quezon'];

/**
 * Role-adaptive presentation screen for managing trails and routes.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered TrailListScreen.
 */
const TrailListScreen: React.FC<TrailListScreenProps> = ({
    trails = [],
    isLoading = false,
    error = null,
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
    onViewTrail,
    onWriteTrail,
    onEditMapPins,
    isSuperadminShell = true,
}) => {
    const { isDesktop, isMobile } = useBreakpoints();

    const {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredTrails,
        metrics,
    } = useTrailList(trails);

    const renderInnerContent = () => (
        <View style={styles.container}>


            {/* SaaS Metrics Platform Cards */}
            <MetricCard
                metrics={[
                    {
                        title: 'Total Trails',
                        count: metrics.total,
                        icon: 'map',
                        library: 'Feather',
                        color: Colors.PRIMARY,
                    },
                    {
                        title: 'Active Trails',
                        count: metrics.activeTrails,
                        icon: 'check-circle',
                        library: 'Feather',
                        color: Colors.PRIMARY,
                    },
                    {
                        title: 'Configured Map Pins',
                        count: metrics.totalMapPins,
                        icon: 'map-pin',
                        library: 'Feather',
                        color: Colors.PRIMARY,
                    },
                    {
                        title: 'Provinces Covered',
                        count: metrics.provincesCovered,
                        icon: 'compass',
                        library: 'Feather',
                        color: Colors.PRIMARY,
                    },
                ]}
            />

            {/* Filter Tabs & Toolbar Action Row */}
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
                            onPress={() => onWriteTrail()}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="plus" size={20} color={Colors.WHITE} />
                        </TouchableOpacity>
                    ) : (
                        <CustomButton
                            title="+ Add Trail"
                            onPress={() => onWriteTrail()}
                            style={styles.desktopCompactAddButton}
                        />
                    )}
                </View>
            </View>

            {/* Trail Cards Responsive Desktop 2-Column Grid */}
            {filteredTrails.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <CustomIcon library="Feather" name="map" size={40} color={Colors.GRAY_MEDIUM} />
                    <CustomText variant="h2" style={styles.emptyStateTitle}>
                        No Trails Found
                    </CustomText>
                    <CustomText variant="caption" style={styles.emptyStateSubtitle}>
                        {searchQuery
                            ? `No trail matching "${searchQuery}" was found.`
                            : 'No trail records have been registered yet.'}
                    </CustomText>
                </View>
            ) : (
                <View style={styles.cardGrid}>
                    {filteredTrails.map((trail) => (
                        <TrailCard
                            key={trail.id}
                            trail={trail}
                            onViewTrail={onViewTrail}
                            onWriteTrail={onWriteTrail}
                            onEditMapPins={onEditMapPins}
                            isDesktop={isDesktop}
                        />
                    ))}
                </View>
            )}
        </View>
    );

    // Render inside SuperadminShell for Superadmin Panel access
    if (isSuperadminShell) {
        return (
            <SuperadminShell
                activeTab="trail"
                pendingCount={pendingCount}
                onTabPress={onTabPress}
                onBackToSettings={onBackToSettings}
                enableSearch={true}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search trail by name, province, or ID..."
            >
                {renderInnerContent()}
            </SuperadminShell>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader
                variant="hybrid"
                title="Trails & Routes"
                isMobile={isMobile}
                onBackPress={onBackToSettings}
                enableSearch={true}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search trail by name, province, or ID..."
            />
            <ResponsiveScrollView contentContainerStyle={styles.adminScrollPadding}>
                {renderInnerContent()}
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 20,
    },
    adminScrollPadding: {
        padding: 16,
        maxWidth: Layout.MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
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
        borderRadius: 24,
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
        ...GlobalStyles.dropShadow(1),
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

export default TrailListScreen;
