/**
 * @file write.tsx
 * @description Controller route for trail creation and editing. Composes useTrailWrite hook and delegates presentation to TrailWriteScreen.
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import LoadingScreen from '@/src/app/loading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import useSuperadminNavigation from '@/src/core/hook/navigation/useSuperadminNavigation';
import useSuperadminDomain from '@/src/core/hook/superadmin/useSuperadminDomain';
import useTrailWrite from '@/src/core/hook/trail/useTrailWrite';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import TrailWriteScreen from '@/src/features/SuperAdmin/screens/tabs/TrailWriteScreen';

/**
 * Controller page for creating or editing trail domain models.
 * 
 * @returns {React.ReactElement} The rendered trail write route page.
 */
export default function write() {
    const { trailId: rawTrailId } = useLocalSearchParams();
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const { isSuperadmin } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const {
        onTabPress,
        onBackToSettingsPress
    } = useSuperadminNavigation();

    const controller = useTrailWrite({ trailId });

    const {
        pendingApplication
    } = useSuperadminDomain(null);

    const pendingCount = pendingApplication?.length || 0;

    if (!controller.object) return <LoadingScreen />;

    return (
        <TrailWriteScreen
            controller={controller}
            onBackPress={onBackPress}
            isSuperadminShell={isSuperadmin}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={isSuperadmin ? onBackToSettingsPress : onBackPress}
        />
    );
}
