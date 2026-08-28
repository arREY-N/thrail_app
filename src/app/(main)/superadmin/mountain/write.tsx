/**
 * @file write.tsx
 * @description Mountain write/edit page controller for Superadmin. Composes mountain write hook and app navigation to render MountainWriteScreen inside SuperadminShell.
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import LoadingScreen from '@/src/app/loading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useMountainWrite } from '@/src/core/models/Mountain/Mountain';
import useSuperadminDomain from '@/src/core/models/Superadmin/hooks/useSuperadminDomain';
import useSuperadminNavigation from '@/src/core/models/Superadmin/hooks/useSuperadminNavigation';
import getSearchParam from '@/src/core/utility/getSearchParam';
import MountainWriteScreen from '@/src/features/SuperAdmin/screens/tabs/MountainWriteScreen';

/**
 * Superadmin mountain write/edit page controller component.
 * 
 * @returns {React.ReactElement} Rendered MountainWriteScreen presentation view or loading overlay.
 */
export default function WriteMountain() {
    const { mountainId: rawId } = useLocalSearchParams();
    const mountainId = getSearchParam(rawId);

    const controller = useMountainWrite({ mountainId });

    const {
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    const {
        onBackPress
    } = useAppNavigation();

    const {
        pendingApplication
    } = useSuperadminDomain(null);

    const pendingCount = pendingApplication?.length || 0;

    if (controller.isLoading) return <LoadingScreen />;

    return (
        <MountainWriteScreen
            mountain={controller.object}
            error={controller.error}
            isLoading={controller.isLoading}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={onBackToSettingsPress}
            onSubmitPress={controller.onSubmitPress}
            onRemovePress={controller.onRemovePress}
            onUpdatePress={controller.onUpdatePress}
            onBackPress={onBackPress}
        />
    );
}