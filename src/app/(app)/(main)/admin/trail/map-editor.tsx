/**
 * @file map-editor.tsx
 * @description Admin Trail Map Editor controller route page.
 * Composes useAppNavigation with the useTrailMapEditor feature hook,
 * delegating UI rendering to TrailMapEditorScreen.
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { TrailMapEditorScreen, useTrailMapEditor } from '@/src/features/Map/Map';

/**
 * Controller screen for visual trail map point editing as an Admin.
 * 
 * @returns {React.JSX.Element} Rendered Admin Trail Map Editor page.
 */
export default function AdminMapEditor(): React.JSX.Element {
    const { trailId: rawTrailId } = useLocalSearchParams();
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const { onBackPress } = useAppNavigation();

    const {
        activeTrail,
        isLoading,
        isSaving,
        offlinePoints,
        onPointsChange,
        onSave,
    } = useTrailMapEditor({ trailId });

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TrailMapEditorScreen
                activeTrail={activeTrail}
                isLoading={isLoading}
                isSaving={isSaving}
                offlinePoints={offlinePoints}
                onPointsChange={onPointsChange}
                onSave={onSave}
                onBackPress={onBackPress}
                isSuperadminShell={false}
                onBackToSettings={onBackPress}
            />
        </>
    );
}
