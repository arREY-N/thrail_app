/**
 * @file list.tsx
 * @description Business list controller for Superadmin. Renders BusinessListScreen tab presentation component.
 */

import React from 'react';

import useSuperadminNavigation from '@/src/core/hook/navigation/useSuperadminNavigation';
import useSuperadmin from '@/src/core/hook/superadmin/useSuperadmin';
import BusinessListScreen from '@/src/features/SuperAdmin/screens/tabs/BusinessListScreen';

export default function listBusiness() {
    const {
        applications,
        businesses,
        businessLoading,
        reloadBusinesses,
        onDeleteBusinessPress,
    } = useSuperadmin(null);

    const {
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    const pendingCount = applications ? applications.filter((a: any) => a.status === 'pending').length : 0;

    return (
        <BusinessListScreen
            businesses={businesses}
            isLoading={businessLoading}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
            onDeletePress={onDeleteBusinessPress}
            reloadBusinesses={reloadBusinesses}
        />
    );
}