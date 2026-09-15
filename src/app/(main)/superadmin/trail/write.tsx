/**
 * @file write.tsx
 * @description Controller route for trail creation and editing in Superadmin and Admin views. Composes useTrailWrite hook and delegates presentation to TrailWriteScreen.
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import LoadingScreen from '@/src/app/loading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useSuperadminDomain, useSuperadminNavigation } from '@/src/core/models/Superadmin/Superadmin';
import { useTrailWrite } from '@/src/core/models/Trail/Trail';
import { useAuthHook } from '@/src/core/models/User/User';
import TrailWriteScreen from '@/src/features/SuperAdmin/screens/tabs/TrailWriteScreen';

/**
 * Controller page for creating or editing trail domain models.
 * 
 * @returns {React.JSX.Element} The rendered trail write route page.
 */
export default function Write(): React.JSX.Element {
    const { trailId: rawTrailId } = useLocalSearchParams();
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const { isSuperadmin } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const {
        onTabPress,
        onBackToSettingsPress,
    } = useSuperadminNavigation();

    const controller = useTrailWrite({ trailId });

    const {
        pendingApplication,
    } = useSuperadminDomain(null);

    const pendingCount = pendingApplication?.length || 0;

    if (controller.isLoading && trailId && !controller.object.id) {
        return <LoadingScreen />;
    }

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
