/**
 * @file map-editor.tsx
 * @description Superadmin Trail Map Editor controller route page.
 * Composes useSuperadminNavigation, useSuperadminDomain, useAuthHook, and useTrailMapEditor,
 * delegating UI rendering to TrailMapEditorScreen.
 */

import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useSuperadminDomain, useSuperadminNavigation } from '@/src/core/models/Superadmin/Superadmin';
import { useAuthHook } from '@/src/core/models/User/User';
import { TrailMapEditorScreen, useTrailMapEditor } from '@/src/features/Map/Map';

/**
 * Superadmin MapEditor controller page route.
 * 
 * @returns {React.JSX.Element} The rendered trail map editor page.
 */
export default function MapEditor(): React.JSX.Element {
    const { trailId: rawTrailId } = useLocalSearchParams();
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const { isSuperadmin } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const {
        onTabPress,
        onBackToSettingsPress,
    } = useSuperadminNavigation();

    const {
        pendingApplication,
    } = useSuperadminDomain(null);

    const pendingCount = pendingApplication?.length || 0;

    const {
        activeTrail,
        isLoading,
        isSaving,
        offlinePoints,
        onPointsChange,
        onSave,
    } = useTrailMapEditor({ trailId });

    return (
        <TrailMapEditorScreen
            activeTrail={activeTrail}
            isLoading={isLoading}
            isSaving={isSaving}
            offlinePoints={offlinePoints}
            onPointsChange={onPointsChange}
            onSave={onSave}
            onBackPress={onBackPress}
            isSuperadminShell={isSuperadmin}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={isSuperadmin ? onBackToSettingsPress : onBackPress}
        />
    );
}
