/**
 * @file useTrailMapEditor.ts
 * @description Feature hook managing the visual map pin editor workflow.
 * Encapsulates trail hydration, working offline point draft state,
 * dirty tracking, validation, and persistence via useTrailsStore.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { IOfflinePoint, newTrail, Trail, useTrailsStore } from '@/src/core/models/Trail/Trail';
import { IWaypointPoint } from '@/src/features/Map/interfaces/Map.types';

/**
 * Parameters for the useTrailMapEditor hook.
 */
export interface UseTrailMapEditorParams {
    trailId: string | null | undefined;
}

/**
 * Return signature of the useTrailMapEditor hook.
 */
export interface TrailMapEditorHookResult {
    activeTrail: Trail | null;
    isLoading: boolean;
    isSaving: boolean;
    isDirty: boolean;
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    hasAttemptedSave: boolean;
    setHasAttemptedSave: React.Dispatch<React.SetStateAction<boolean>>;
    offlinePoints: (IOfflinePoint | IWaypointPoint)[];
    onPointsChange: (points: (IOfflinePoint | IWaypointPoint)[]) => void;
    onSave: (showToast?: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void) => Promise<boolean>;
    resetDirty: () => void;
}

/**
 * Feature hook orchestrating the complete trail map pin editor lifecycle.
 *
 * @param params - Hook parameters containing the trailId.
 * @returns {TrailMapEditorHookResult} Map pin editor state and handler operations.
 */
export function useTrailMapEditor({ trailId }: UseTrailMapEditorParams): TrailMapEditorHookResult {
    const trails = useTrailsStore((s) => s.data);
    const load = useTrailsStore((s) => s.load);
    const create = useTrailsStore((s) => s.create);
    const isLoadingStore = useTrailsStore((s) => s.isLoading);

    const activeTrail = trails.find((t) => t.id === trailId) || null;
    const [offlinePoints, setOfflinePoints] = useState<(IOfflinePoint | IWaypointPoint)[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [hasAttemptedSave, setHasAttemptedSave] = useState<boolean>(false);
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
            setIsDirty(false);
            setHasAttemptedSave(false);
        }
    }, [activeTrail]);

    const onPointsChange = useCallback((updatedPoints: (IOfflinePoint | IWaypointPoint)[]) => {
        setOfflinePoints(updatedPoints);
        setIsDirty(true);
        setHasAttemptedSave(false);
    }, []);

    const onSave = useCallback(async (
        showToast?: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void
    ): Promise<boolean> => {
        if (!activeTrail) return false;

        setIsSaving(true);
        try {
            const updatedTrail = newTrail({
                ...activeTrail,
                offlinePoints: offlinePoints as IOfflinePoint[],
            });

            const success = await create(updatedTrail);
            if (success) {
                setIsDirty(false);
                setHasAttemptedSave(false);
                showToast?.("Offline map points saved successfully.", "success");
                return true;
            } else {
                showToast?.("Failed to update offline points.", "error");
                return false;
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to save points.";
            showToast?.(message, "error");
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [activeTrail, offlinePoints, create]);

    const resetDirty = useCallback(() => {
        setIsDirty(false);
        setHasAttemptedSave(false);
    }, []);

    return {
        activeTrail,
        isLoading: isLoadingStore && !activeTrail,
        isSaving,
        isDirty,
        setIsDirty,
        hasAttemptedSave,
        setHasAttemptedSave,
        offlinePoints,
        onPointsChange,
        onSave,
        resetDirty,
    };
}
