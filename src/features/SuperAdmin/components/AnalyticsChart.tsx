/**
 * @file AnalyticsChart.tsx
 * @description Master composite analytics component composing HikerAreaChart, UserRolesDonutChart, and RegionalBarChart.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Application } from '@/src/core/models/Application/Application';
import { Business } from '@/src/core/models/Business/Business';
import { Trail } from '@/src/core/models/Trail/Trail';
import { User } from '@/src/core/models/User/User';
import HikerAreaChart from '@/src/features/SuperAdmin/components/charts/HikerAreaChart';
import RegionalBarChart from '@/src/features/SuperAdmin/components/charts/RegionalBarChart';
import UserRolesDonutChart from '@/src/features/SuperAdmin/components/charts/UserRolesDonutChart';

/**
 * Props for the AnalyticsChart component.
 * 
 * @param trails - Array of trail objects.
 * @param users - Array of hiker/standard user objects.
 * @param admin - Array of business admin user objects.
 * @param superadmin - Array of superadmin user objects.
 * @param applications - Array of business application objects.
 * @param businesses - Array of registered business objects.
 */
interface Props {
    trails?: Trail[];
    users?: User[];
    admin?: User[];
    superadmin?: User[];
    applications?: Application[];
    businesses?: Business[];
}

/**
 * Master composite analytics component composing HikerAreaChart, UserRolesDonutChart, and RegionalBarChart.
 * 
 * @param props - Component properties.
 * @returns {React.ReactElement} The rendered analytics chart grid layout.
 */
const AnalyticsChart = ({
    trails = [],
    users = [],
    admin = [],
    superadmin = [],
    applications = [],
    businesses = [],
}: Props): React.JSX.Element => {
    const hikerCount = users.length;
    const adminCount = admin.length;
    const superadminCount = superadmin.length;
    const totalUserCount = hikerCount + adminCount + superadminCount;

    return (
        <View style={styles.container}>
            {/* Top Component: Full-Width Hiker Registrations SVG Area Wave Chart */}
            <View style={styles.areaChartWrapper}>
                <HikerAreaChart
                    users={users}
                    hikerCount={hikerCount}
                    totalUserCount={totalUserCount}
                />
            </View>

            {/* Bottom Component: Side-by-Side Balanced 2-Column Grid */}
            <View style={styles.sideBySideRow}>
                <UserRolesDonutChart
                    hikerCount={hikerCount}
                    adminCount={adminCount}
                    superadminCount={superadminCount}
                />
                
                <RegionalBarChart
                    trails={trails}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 20,
        width: '100%',
    },
    areaChartWrapper: {
        zIndex: 10,
    },
    sideBySideRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        width: '100%',
        zIndex: 1,
    },
});

export default AnalyticsChart;
