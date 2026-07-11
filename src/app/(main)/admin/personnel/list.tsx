/**
 * @file list.tsx
 * @description Expo Router page controller for the personnel list dashboard. Composes useAuthHook and useAdmin to present the UI.
 */

import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAdmin } from "@/src/core/hook/admin/useAdmin";
import useAdminNavigation from "@/src/core/hook/navigation/useAdminNavigation";

import { useAuthHook } from "@/src/core/hook/user/useAuthHook";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import PersonnelListScreen from "@/src/features/Admin/screens/Personnel/PersonnelListScreen";
import { Stack } from 'expo-router';

/**
 * PersonnelList page controller component.
 */
export default function personnelList() {
    const { profile, businessId, role, isLoading } = useAuthHook(); 
    
    const {onBackPress} = useAppNavigation();

    if(isLoading) return <LoadingScreen/>

    if(!profile || !businessId || !role) return <UnauthorizedScreen/>

    const {
        businessAdmins,
        onReloadPress,
        businessAccount
    } = useAdmin({ businessId });

    const { onAddAdminPress } = useAdminNavigation({
        userId: profile.id,
        businessId,
        role,
    });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <PersonnelListScreen
                businessId={businessId}
                businessAdmins={businessAdmins}
                ownerId={businessAccount?.owner?.id}
                currentUserId={profile?.id}
                onReloadPress={onReloadPress}
                onAddAdminPress={onAddAdminPress}
                onBackPress={onBackPress} 
            />
        </>
    )
}
