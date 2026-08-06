/**
 * @file list.tsx
 * @description Mountains database list page controller for Superadmin. Composes auth, mountain domain, and navigation hooks to render MountainListScreen inside SuperadminShell.
 */

import React from 'react';

import useMountain from '@/src/core/hook/mountain/useMountain';
import useSuperadminNavigation from '@/src/core/hook/navigation/useSuperadminNavigation';

import useSuperadminDomain from '@/src/core/hook/superadmin/useSuperadminDomain';
import MountainListScreen from '@/src/features/SuperAdmin/screens/tabs/MountainListScreen';

/**
 * Superadmin mountains list page controller component.
 * 
 * @returns {React.ReactElement} Rendered MountainListScreen presentation view.
 */
export default function listMountains() {
    const {
        isLoading,
        mountains,
        onWritePress
    } = useMountain();

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