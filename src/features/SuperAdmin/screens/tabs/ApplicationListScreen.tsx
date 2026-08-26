/**
 * @file ApplicationListScreen.tsx
 * @description Superadmin presentation screen for managing business applications.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import CustomFilterTabs from '@/src/components/CustomFilterTabs';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { IApplication } from '@/src/core/models/Application/Application';
import { formatDate } from '@/src/core/utility/date';
import MetricCard from '@/src/features/SuperAdmin/components/MetricCard';
import { SuperadminTab } from '@/src/features/SuperAdmin/components/Sidebar';
import SuperadminShell from '@/src/features/SuperAdmin/components/SuperadminShell';
import SuperadminCard from '@/src/features/SuperAdmin/components/SuperadminCard';
import useApplicationList from '@/src/features/SuperAdmin/hooks/useApplicationList';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

export interface ApplicationListScreenProps {
    applications: IApplication[];
    pendingCount?: number;
    onTabPress: (tab: SuperadminTab) => void;
    onBackToSettings: () => void;
    onViewApplicationPress: (id: string) => void;
}

const FILTER_TABS = ['All', 'Pending', 'Approved', 'Rejected'];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'approved': return Colors.STATUS_APPROVED_TEXT;
        case 'rejected': return Colors.ERROR;
        case 'pending':
        default: return Colors.STATUS_WARNING_TEXT;
    }
};

const getStatusBgColor = (status: string) => {
    switch (status) {
        case 'approved': return Colors.STATUS_APPROVED_BG;
        case 'rejected': return Colors.ERROR_BG;
        case 'pending':
        default: return Colors.STATUS_WARNING_BG;
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'approved': return 'check-circle';
        case 'rejected': return 'x-circle';
        case 'pending':
        default: return 'clock';
    }
};

const ApplicationListScreen: React.FC<ApplicationListScreenProps> = ({
    applications = [],
    pendingCount = 0,
    onTabPress,
    onBackToSettings,
    onViewApplicationPress,
}) => {
    const { isDesktop } = useBreakpoints();

    const {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredApplications,
        metrics,
    } = useApplicationList(applications);

    return (
        <SuperadminShell
            activeTab="application"
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettings}
            enableSearch={true}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search applications..."
        >
            <View style={styles.container}>
                {/* Platform Metrics SaaS Card Bar */}
                <MetricCard
                    metrics={[
                        {
                            title: 'Total Applications',
                            count: metrics.total,
                            icon: 'file-text',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Pending Applications',
                            count: metrics.pending,
                            icon: 'clock',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Approved Applications',
                            count: metrics.approved,
                            icon: 'check-circle',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                        {
                            title: 'Rejected Applications',
                            count: metrics.rejected,
                            icon: 'x-circle',
                            library: 'Feather',
                            color: Colors.PRIMARY,
                        },
                    ]}
                />

                {/* Filter Tabs Row */}
                <CustomFilterTabs
                    tabs={FILTER_TABS}
                    activeTab={activeTab}
                    onTabSelect={setActiveTab}
                    variant="pill"
                />

                {/* Application Grid/List */}
                {filteredApplications.length > 0 ? (
                    <View style={styles.listContainer}>
                        {filteredApplications.map((app) => (
                            <SuperadminCard
                                key={app.id}
                                iconName={getStatusIcon(app.status)}
                                iconBgColor={getStatusBgColor(app.status)}
                                iconColor={getStatusColor(app.status)}
                                title={app.name || 'Unnamed Business'}
                                subtitle={`ID: ${app.id}`}
                                headerAction={{
                                    icon: 'arrow-right',
                                    color: Colors.PRIMARY,
                                    onPress: () => onViewApplicationPress(app.id),
                                }}
                                infoRows={[
                                    { icon: 'user', label: 'Applicant:', value: app.owner?.name || 'Unknown Applicant' },
                                    { icon: 'calendar', label: 'Applied Date:', value: formatDate(app.createdAt) },
                                ]}
                                isDesktop={isDesktop}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <CustomIcon library="FontAwesome5" name="folder-open" size={40} color={Colors.GRAY_MEDIUM} />
                        <CustomText variant="h2" style={styles.emptyStateTitle}>
                            No Applications Found
                        </CustomText>
                        <CustomText variant="caption" style={styles.emptyStateSubtitle}>
                            {searchQuery
                                ? `No application matching "${searchQuery}" was found.`
                                : 'No applications match the current filter.'}
                        </CustomText>
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
    listContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
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
});

export default ApplicationListScreen;
