/**
 * @file write.tsx
 * @description Expo Router page controller for adding new business personnel. Composes useAuthHook and useAdminWrite to present the UI.
 */

import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import useAdminWrite from "@/src/core/hook/admin/useAdminWrite";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import PersonnelWriteScreen from "@/src/features/Admin/screens/Personnel/PersonnelWriteScreen";
import { Stack } from 'expo-router';

/**
 * PersonnelWrite page controller component.
 */
export default function personnel() {
    const { profile, isLoading } = useAuthHook();

    const { onBackPress } = useAppNavigation();

    if (isLoading) return <LoadingScreen />;

    if (!profile) return <UnauthorizedScreen />; 
    
    const controller = useAdminWrite({ userId: profile.id });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <PersonnelWriteScreen 
                businessAdmins={controller.businessAdmins}
                onFindUserPress={controller.onFindUserPress}
                searched={controller.searched}
                onMakeAdminPress={controller.onMakeAdminPress}
                isOwner={controller.isOwner}
                isLoading={controller.isLoading}
                error={controller.error}
                success={controller.success}
                onBackPress={onBackPress} 
            />  
        </>  
    );
}
