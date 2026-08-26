import { Stack } from 'expo-router';

import UnauthorizedScreen from '@/src/app/unauthorized';
import { useAdmin } from '@/src/core/hook/admin/useAdmin';
import useAdminNavigation from '@/src/core/hook/navigation/useAdminNavigation';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { useBusinessesStore } from '@/src/core/models/Business/Business';
import { useOfferStore } from '@/src/core/models/Offer/Offer';
import { useAuthStore } from '@/src/core/stores/authStores/authStore';
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
    } = useAdmin({ businessId });

    const { onBackPress } = useAppNavigation();

    const {
        onManageAdminsPress,
        onManageOffersPress,
        onManageTrailsPress,
    } = useAdminNavigation({
        userId: profile?.id,
        businessId: businessId || undefined,
        role: role || undefined,
    });

    const showLoading = isLoading || !businessAccount || !profile;

    // Handle retry press for loading and error states
    const onRetryPress = () => {
        useAuthStore.getState().initialize();
        if (businessId) {
            useBusinessesStore.getState().load(businessId);
            useBusinessesStore.getState().loadBusinessAdmins(businessId);
            useOfferStore.getState().fetchOfferByBusiness(businessId);
        }
    };

    // Handle loading and error states
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
                onRetryPress={onRetryPress}
            />
        </>
    );
}
