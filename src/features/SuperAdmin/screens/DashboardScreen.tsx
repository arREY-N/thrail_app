/**
 * @file DashboardScreen.tsx
 * @description Superadmin Dashboard presentation screen embedded inside SuperadminShell with 2-column web grid layout, metric cards, pending alerts, and real-time database visual analytics charts.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import useSuperadminNavigation from '@/src/core/hook/navigation/useSuperadminNavigation';
import { Application } from '@/src/core/models/Application/Application';
import { Business } from '@/src/core/models/Business/Business';
import { Mountain } from '@/src/core/models/Mountain/Mountain';
import { Trail } from '@/src/core/models/Trail/Trail';
import { User } from '@/src/core/models/User/User';
import AnalyticsChart from '@/src/features/SuperAdmin/components/AnalyticsChart';
import MetricCard from '@/src/features/SuperAdmin/components/MetricCard';
import PendingPanel from '@/src/features/SuperAdmin/components/PendingPanel';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';

/**
 * Props for the DashboardScreen component.
 * 
 * @param businesses - Array of registered business objects.
 * @param trails - Array of trail objects.
 * @param superadmin - Array of superadmin user objects.
 * @param admin - Array of business admin user objects.
 * @param users - Array of hiker/standard user objects.
 * @param mountains - Array of mountain objects.
 * @param pendingApplication - Array of pending application objects.
 * @param onManageBusinessPress - Callback to navigate to business management.
 * @param onManageTrailsPress - Callback to navigate to trail management.
 * @param onManageUsersPress - Callback to navigate to user management.
 * @param onManageMountainPress - Callback to navigate to mountain management.
 * @param onManageApplicationPress - Callback to navigate to applications list.
 * @param onBackPress - Callback to navigate back to Settings/Profile screen.
 */
interface Props {
    businesses?: Business[];
    trails?: Trail[];
    superadmin?: User[];
    admin?: User[];
    users?: User[];
    mountains?: Mountain[];
    pendingApplication?: Application[];
    onManageBusinessPress: () => void;
    onManageTrailsPress: () => void;
    onManageUsersPress: () => void;
    onManageMountainPress: () => void;
    onManageApplicationPress: () => void;
    onBackPress?: () => void;
}

/**
 * DashboardScreen presentation component rendering metrics, alert banner, and analytics charts.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered admin dashboard presentation screen.
 */
const DashboardScreen = ({
    businesses = [],
    trails = [],
    superadmin = [],
    admin = [],
    users = [],
    mountains = [],
    pendingApplication = [],
    onManageBusinessPress,
    onManageTrailsPress,
    onManageUsersPress,
    onManageMountainPress,
    onManageApplicationPress,
}: Props): React.JSX.Element => {
    const { onBackToSettingsPress, onTabPress } = useSuperadminNavigation();

    const hikerCount = users.length;
    const totalUsers = users.length + admin.length + superadmin.length;
    const totalTrailsCount = trails.length;
    const totalMountainsCount = mountains.length;
    const pendingCount = pendingApplication.length;

    return (
        <SuperadminShell
            activeTab="dashboard"
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
        >
            {/* Pending Application Alert Banner */}
            <View style={styles.sectionContainer}>
                <PendingPanel
                    pendingCount={pendingCount}
                    onReviewPress={onManageApplicationPress}
                />
            </View>

            {/* Platform Metrics Section Header */}
            <View style={styles.sectionContainer}>
                <CustomText variant="h3" style={styles.sectionTitle}>
                    Platform Metrics
                </CustomText>

                {/* Unified SaaS Metric Bar Card */}
                <MetricCard
                    metrics={[
                        {
                            title: 'Total Users',
                            count: totalUsers,
                            icon: 'users',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                            subtitle: `${hikerCount} Hikers`,
                            subIcon: 'user-check',
                            subLibrary: 'Feather',
                            onPress: onManageUsersPress,
                        },
                        {
                            title: 'Tour Guides',
                            count: businesses.length,
                            icon: 'briefcase',
                            library: 'Feather',
                            color: Colors.BLUE,
                            subtitle: `${businesses.length} Verified`,
                            subIcon: 'check-circle',
                            subLibrary: 'Feather',
                            onPress: onManageBusinessPress,
                        },
                        {
                            title: 'Active Trails',
                            count: totalTrailsCount,
                            icon: 'map',
                            library: 'Feather',
                            color: Colors.ORANGE,
                            subtitle: `${totalTrailsCount} Routes`,
                            subIcon: 'navigation',
                            subLibrary: 'Feather',
                            onPress: onManageTrailsPress,
                        },
                        {
                            title: 'Mountains',
                            count: totalMountainsCount,
                            icon: 'mountain',
                            library: 'FontAwesome5',
                            color: Colors.PRIMARY,
                            subtitle: `${totalMountainsCount} Peaks`,
                            subIcon: 'flag',
                            subLibrary: 'Feather',
                            onPress: onManageMountainPress,
                        },
                    ]}
                />
            </View>

            {/* Visual Analytics & Distribution Section */}
            <View style={styles.sectionContainer}>
                <CustomText variant="h3" style={styles.sectionTitle}>
                    Analytics & Distribution
                </CustomText>

                <AnalyticsChart
                    trails={trails}
                    users={users}
                    admin={admin}
                    superadmin={superadmin}
                    applications={pendingApplication}
                    businesses={businesses}
                />
            </View>
        </SuperadminShell>
    );
};

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        marginBottom: 10,
        color: Colors.TEXT_PRIMARY,
        fontWeight: 'bold',
    },
    metricsGrid: {},
    metricsGridDesktop: {
        flexDirection: 'row',
        gap: 16,
    },
    metricsGridMobile: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metricCardWrapper: {
        flex: 1,
        minWidth: 140,
    },
});

export default DashboardScreen;