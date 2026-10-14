/**
 * @file map-editor.tsx
 * @description Admin Trail Map Editor controller route page.
 * Composes useTrailsStore, useAuthHook, and useAppNavigation, delegating UI rendering to TrailMapEditorScreen with isSuperadminShell={false}.
 */

import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { IOfflinePoint, newTrail, useTrailsStore } from '@/src/core/models/Trail/Trail';
import TrailMapEditorScreen from '@/src/features/SuperAdmin/screens/tabs/TrailMapEditorScreen';

/**
 * Controller screen for visual trail map point editing as an Admin.
 * 
 * @returns {React.JSX.Element} Rendered Admin Trail Map Editor page.
 */
export default function AdminMapEditor(): React.JSX.Element {
    const { trailId: rawTrailId } = useLocalSearchParams();
    const trailId = Array.isArray(rawTrailId) ? rawTrailId[0] : rawTrailId;

    const { onBackPress } = useAppNavigation();
    const trails = useTrailsStore((s) => s.data);
    const load = useTrailsStore((s) => s.load);
    const create = useTrailsStore((s) => s.create);
    const isLoadingStore = useTrailsStore((s) => s.isLoading);

    const activeTrail = trails.find((t) => t.id === trailId) || null;
    const [offlinePoints, setOfflinePoints] = useState<IOfflinePoint[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const initializedTrailIdRef = useRef<string | null>(null);

    // Hydrate store if deep-linked or refreshed with empty cache
    useEffect(() => {
        if (trails.length === 0 && trailId) {
            load(trailId);
        }
    }, [trails.length, trailId, load]);

    // Initialize offline points ONLY once per trailId to preserve unsaved local edits
    useEffect(() => {
        if (activeTrail && initializedTrailIdRef.current !== activeTrail.id) {
            initializedTrailIdRef.current = activeTrail.id;
            setOfflinePoints(activeTrail.offlinePoints || []);
        }
    }, [activeTrail]);

    const handleSave = async (showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void) => {
        if (!activeTrail) return;

        setIsSaving(true);
        try {
            const updatedTrail = newTrail({
                ...activeTrail,
                offlinePoints: offlinePoints,
            });

            const success = await create(updatedTrail);
            if (success) {
                showToast("Offline map points saved successfully.", "success");
            } else {
                showToast("Failed to update offline points.", "error");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to save points.";
            showToast(message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TrailMapEditorScreen
                activeTrail={activeTrail}
                isLoading={isLoadingStore && !activeTrail}
                isSaving={isSaving}
                offlinePoints={offlinePoints}
                onPointsChange={setOfflinePoints}
                onSave={handleSave}
                onBackPress={onBackPress}
                isSuperadminShell={false}
                onBackToSettings={onBackPress}
            />
        </>
    );
}
