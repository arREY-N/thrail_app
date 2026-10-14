/**
 * @file list.tsx
 * @description Admin Trail List controller route.
 * Renders TrailListScreen in standard Admin layout (with CustomHeader, no SuperadminShell)
 * and navigates within the /(main)/admin/trail route tree.
 */

import { router, Stack } from 'expo-router';
import React from 'react';

import LoadingScreen from '@/src/app/loading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useTrailList } from '@/src/core/models/Trail/Trail';
import TrailListScreen from '@/src/features/SuperAdmin/screens/tabs/TrailListScreen';

/**
 * Controller screen for Admin Trail List.
 * 
 * @returns {React.JSX.Element} Rendered Admin Trail List page.
 */
export default function AdminListTrail(): React.JSX.Element {
    const { onTrailPress, onBackPress } = useAppNavigation();
    const { trails, trailLoading, trailError } = useTrailList();

    if (trailLoading) return <LoadingScreen />;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TrailListScreen
                trails={trails}
                isLoading={trailLoading}
                error={trailError}
                onTabPress={() => {}}
                onBackToSettings={onBackPress}
                onViewTrail={onTrailPress}
                onWriteTrail={(id) => {
                    if (id) {
                        router.push({
                            pathname: '/admin/trail/write',
                            params: { trailId: id },
                        });
                    } else {
                        router.push('/admin/trail/write');
                    }
                }}
                onEditMapPins={(id) => {
                    router.push({
                        pathname: '/admin/trail/map-editor',
                        params: { trailId: id },
                    });
                }}
                isSuperadminShell={false}
            />
        </>
    );
}
