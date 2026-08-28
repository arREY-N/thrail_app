/**
 * @file list.tsx
 * @description Business list controller for Superadmin. Renders BusinessListScreen tab presentation component.
 */


import useSuperadmin from '@/src/core/models/Superadmin/hooks/useSuperadmin';
import useSuperadminNavigation from '@/src/core/models/Superadmin/hooks/useSuperadminNavigation';
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