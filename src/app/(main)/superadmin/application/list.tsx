/**
 * @file list.tsx
 * @description Application list controller for Superadmin. Wrapped inside SuperadminShell for persistent sidebar navigation.
 */

import useApply from '@/src/core/hook/apply/useApply';
import { useSuperadminDomain, useSuperadminNavigation } from '@/src/core/models/Superadmin/Superadmin';
import { useAuthHook } from '@/src/core/models/User/User';
import ApplicationListScreen from '@/src/features/SuperAdmin/screens/tabs/ApplicationListScreen';

export default function ListApplications() {
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