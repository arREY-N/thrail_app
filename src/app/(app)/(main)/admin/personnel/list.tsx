/**
 * @file list.tsx
 * @description Expo Router page controller for the personnel list dashboard. Composes useAuthHook and useAdmin to present the UI.
 */

import UnauthorizedScreen from "@/src/app/unauthorized";


import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useAdminNavigation } from "@/src/core/models/Admin/Admin";
import { useBusinessAdmin } from "@/src/core/models/Business/Business";
import PersonnelListScreen from "@/src/features/Admin/screens/Personnel/PersonnelListScreen";
import { Stack } from 'expo-router';

/**
 * PersonnelList page controller component.
 */
export default function PersonnelList() {

    const { onBackPress } = useAppNavigation();

    const {
        businessAdmins,
        onRefresh: onReloadPress,
        businessAccount,
        isLoading,
        profile,
        businessId,
        role,
    } = useBusinessAdmin();

    const { onAddAdminPress } = useAdminNavigation();

    if (!profile || !businessId || !role) return <UnauthorizedScreen />

    const isBusinessOwner = Boolean(
        role === 'owner' ||
        (businessAccount?.owner?.id && profile?.id && businessAccount.owner.id === profile.id)
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <PersonnelListScreen
                businessId={businessId}
                businessAdmins={businessAdmins}
                ownerId={businessAccount?.owner?.id}
                currentUserId={profile?.id}
                isOwner={isBusinessOwner}
                isLoading={isLoading}
                onReloadPress={onReloadPress}
                onAddAdminPress={onAddAdminPress}
                onBackPress={onBackPress}
            />
        </>
    )
}
