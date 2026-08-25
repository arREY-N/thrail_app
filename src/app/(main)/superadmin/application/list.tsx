/**
 * @file list.tsx
 * @description Application list controller for Superadmin. Wrapped inside SuperadminShell for persistent sidebar navigation.
 */

import React from 'react';
import useApply from '@/src/core/hook/apply/useApply';
import useSuperadminNavigation from '@/src/core/hook/navigation/useSuperadminNavigation';
import useSuperadminDomain from '@/src/core/hook/superadmin/useSuperadminDomain';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import ApplicationListScreen from '@/src/features/SuperAdmin/screens/tabs/ApplicationListScreen';

export default function listApplications() {
    const { role } = useAuthHook();
    const { onViewApplicationPress } = useSuperadminDomain(null);
    const { applications } = useApply({ role } as any);
    const { onTabPress, onBackToSettingsPress } = useSuperadminNavigation();

    const pendingCount = applications.filter((a) => a.status === 'pending').length;

    return (
        <ApplicationListScreen
            applications={applications}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
            onViewApplicationPress={onViewApplicationPress}
        />
    );
}