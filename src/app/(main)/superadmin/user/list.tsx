/**
 * @file list.tsx
 * @description User accounts management controller for Superadmin. Composes auth, user domain, and navigation hooks to render UserListScreen inside SuperadminShell.
 */

import React from 'react';

import { useSuperadminDomain, useSuperadminNavigation } from '@/src/core/models/Superadmin/Superadmin';
import { useAuthHook, useUser } from '@/src/core/models/User/User';
import UserListScreen from '@/src/features/SuperAdmin/screens/tabs/UserListScreen';

/**
 * Superadmin user accounts list page controller component.
 * 
 * @returns {React.ReactElement} The rendered UserListScreen presentation view.
 */
export default function ListUsers() {
    const { role } = useAuthHook();
    const {
        users,
        isLoading,
        error
    } = useUser();

    const {
        pendingApplication
    } = useSuperadminDomain(null);

    const {
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    const pendingCount = pendingApplication?.length || 0;

    return (
        <UserListScreen
            users={users}
            isLoading={isLoading}
            error={error}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
        />
    );
}