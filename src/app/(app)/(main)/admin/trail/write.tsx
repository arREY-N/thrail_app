/**
 * @file write.tsx
 * @description Admin Trail Write controller route.
 * Renders TrailWriteScreen with isSuperadminShell={false}, adapting layout to Admin ScreenWrapper + CustomHeader.
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

import LoadingScreen from '@/src/app/loading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useTrailWrite } from '@/src/core/models/Trail/Trail';
import TrailWriteScreen from '@/src/features/SuperAdmin/screens/tabs/TrailWriteScreen';

/**
 * Controller screen for creating or editing trails as an Admin.
 * 
 * @returns {React.JSX.Element} Rendered Admin Trail Write page.
 */
export default function AdminWriteTrail(): React.JSX.Element {
    const { trailId: rawTrailId } = useLocalSearchParams();
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const { onBackPress } = useAppNavigation();
    const controller = useTrailWrite({ trailId });

    if (controller.isLoading && trailId && !controller.object.id) {
        return <LoadingScreen />;
    }

    const uploadPicture = () => {
        console.log('[TrailWrite] uploadPicture placeholder invoked (Awaiting backend storage service)');
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TrailWriteScreen
                controller={controller}
                onBackPress={onBackPress}
                isSuperadminShell={false}
                onBackToSettings={onBackPress}
                uploadPicture={uploadPicture}
            />
        </>
    );
}
