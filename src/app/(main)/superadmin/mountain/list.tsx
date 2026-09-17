/**
 * @file list.tsx
 * @description Mountains database list page controller for Superadmin. Composes auth, mountain domain, and navigation hooks to render MountainListScreen inside SuperadminShell.
 */

import { useMountainList } from '@/src/core/models/Mountain/Mountain';
import { useSuperadminDomain, useSuperadminNavigation } from '@/src/core/models/Superadmin/Superadmin';
import MountainListScreen from '@/src/features/SuperAdmin/screens/tabs/MountainListScreen';
import React from 'react';

/**
 * Superadmin mountains list page controller component.
 * 
 * @returns {React.ReactElement} Rendered MountainListScreen presentation view.
 */
export default function ListMountains() {
    const {
        isLoading,
        mountains,
        onWritePress
    } = useMountainList();

    const {
        pendingApplication
    } = useSuperadminDomain(null);

    const {
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    const pendingCount = pendingApplication?.length || 0;

    return (
        <MountainListScreen
            mountains={mountains}
            isLoading={isLoading}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
            onWritePress={onWritePress}
        />
    );
}