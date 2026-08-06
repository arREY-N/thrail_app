/**
 * @file index.tsx
 * @description Controller page for the Superadmin Dashboard. Composes useSuperadminDomain and useAppNavigation to pass real-time platform statistics and navigation handlers to DashboardScreen.
 */

import React from 'react';
import { Stack } from 'expo-router';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useSuperadminDomain from '@/src/core/hook/superadmin/useSuperadminDomain';
import DashboardScreen from '@/src/features/SuperAdmin/screens/DashboardScreen';

/**
 * Superadmin Dashboard page controller component.
 * 
 * @returns {React.ReactElement} The rendered DashboardScreen wrapped with Expo Router Stack screen options.
 */
export default function superadminDashboard() {
    const {
        businesses,
        trails,
        superadmin,
        admin,
        users,
        mountains,
        pendingApplication,
        onManageBusinessPress,
        onManageTrailsPress,
        onManageUsersPress,
        onManageMountainPress,
        onManageApplicationPress,
    } = useSuperadminDomain(null);

    const { onBackPress } = useAppNavigation();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            
            <DashboardScreen
                businesses={businesses}
                trails={trails}
                superadmin={superadmin}
                admin={admin}
                users={users}
                mountains={mountains}
                pendingApplication={pendingApplication}
                onManageBusinessPress={onManageBusinessPress}
                onManageTrailsPress={onManageTrailsPress}
                onManageUsersPress={onManageUsersPress}
                onManageMountainPress={onManageMountainPress}
                onManageApplicationPress={onManageApplicationPress}
                onBackPress={onBackPress}
            />
        </>
    );
}