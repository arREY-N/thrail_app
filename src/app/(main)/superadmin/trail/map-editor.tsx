/**
 * @file map-editor.tsx
 * @description Controller route page for superadmin/admin visual trail map point editing.
 * Composes useTrailsStore, useAuthHook, and useSuperadminNavigation, delegating UI rendering to TrailMapEditorScreen.
 */

import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useSuperadminDomain, useSuperadminNavigation } from "@/src/core/models/Superadmin/Superadmin";
import { IOfflinePoint, newTrail, useTrailsStore } from "@/src/core/models/Trail/Trail";
import { useAuthHook } from "@/src/core/models/User/User";

import TrailMapEditorScreen from "@/src/features/SuperAdmin/screens/tabs/TrailMapEditorScreen";

/**
 * MapEditor controller page route.
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
        onBackToSettingsPress
    } = useSuperadminNavigation();

    const trails = useTrailsStore((s) => s.data);
    const load = useTrailsStore((s) => s.load);
    const create = useTrailsStore((s) => s.create);
    const isLoadingStore = useTrailsStore((s) => s.isLoading);

    const activeTrail = trails.find((t) => t.id === trailId) || null;
    const [offlinePoints, setOfflinePoints] = useState<IOfflinePoint[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const initializedTrailIdRef = useRef<string | null>(null);

    const {
        pendingApplication
    } = useSuperadminDomain(null);

    const pendingCount = pendingApplication?.length || 0;

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

    /**
     * Persists the modified list of offline map points back to the trails store.
     * 
     * @async
     * @param showToast - Toast callback to display feedback.
     * @returns {Promise<void>}
     */
    const handleSave = async (
        showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void
    ): Promise<void> => {
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
                setTimeout(() => 1200);
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
        <TrailMapEditorScreen
            activeTrail={activeTrail}
            isLoading={isLoadingStore}
            isSaving={isSaving}
            offlinePoints={offlinePoints}
            onPointsChange={setOfflinePoints}
            onSave={handleSave}
            onBackPress={onBackPress}
            isSuperadminShell={isSuperadmin}
            pendingCount={pendingCount}
            onTabPress={onTabPress}
            onBackToSettings={isSuperadmin ? onBackToSettingsPress : onBackPress}
        />
    );
}
