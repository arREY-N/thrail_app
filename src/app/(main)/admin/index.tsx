import { Stack } from 'expo-router';

import UnauthorizedScreen from '@/src/app/unauthorized';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { useAdminNavigation } from '@/src/core/models/Admin/Admin';
import { useBusinessAdmin } from '@/src/core/models/Business/Business';
import DashboardScreen from '@/src/features/Admin/screens/DashboardScreen';

/**
 * Controller component for the Admin Dashboard.
 * Handles authentication checks, queries business configurations,
 * maps navigation actions, and manages loading/error reload triggers.
 */
export default function AdminHome() {
    const {
        businessId,
        profile,
        error,
        role,
        isLoading,
    } = useAuthHook();


    const {
        businessAccount,
        onRefresh
    } = useBusinessAdmin();

    const { onBackPress } = useAppNavigation();

    const {
        onManageAdminsPress,
        onManageOffersPress,
        onManageTrailsPress,
    } = useAdminNavigation();

    const showLoading = isLoading || !businessAccount || !profile;


    if (!isLoading && (!businessId || !profile || !role))
        return <UnauthorizedScreen />;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <DashboardScreen
                businessAccount={businessAccount}
                onManageAdminsPress={onManageAdminsPress}
                onManageOffersPress={onManageOffersPress}
                onManageTrailsPress={onManageTrailsPress}
                adminProfile={profile}
                error={error as string | null}
                onBackPress={onBackPress}
                isLoading={showLoading}
                onRetryPress={onRefresh}
            />
        </>
    );
}
