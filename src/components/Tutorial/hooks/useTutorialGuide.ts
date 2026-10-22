/**
 * @file useTutorialGuide.ts
 * @description Reusable hook that manages per-user, per-screen tutorial completion state
 * backed by `User.onTutorialComplete` in Firestore + an in-memory session cache and AsyncStorage fallback.
 * Uses granular `useAuthStore` selectors and `InteractionManager` for zero-lag screen mounting.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import {
    TutorialCompletionMap,
    TutorialStep,
    TutorialTourConfig,
    TutorialTourId,
    UseTutorialGuideReturn,
} from '@/src/components/Tutorial/interfaces/Tutorial.types';
import { createReplayHelpStep, TUTORIAL_TOURS } from '@/src/components/Tutorial/constants';
import { getWebNavTourSteps } from '@/src/components/Tutorial/constants/tabsTour';
import { normalizeTutorialComplete, useAuthStore, UserRepo } from '@/src/core/models/User/User';

const STORAGE_KEY_PREFIX = '@thrail_tutorials_v1_';

/**
 * In-memory session cache keyed by `storageKey` so `AsyncStorage.getItem` is executed
 * at most once per user session across all screens and booking step transitions.
 */
const sessionCompletionCache = new Map<string, TutorialCompletionMap>();

/**
 * Hook to manage step-by-step in-app tutorials scoped to the authenticated user ID and tour module.
 *
 * @param tourId - Identifier of the tour to load (e.g., 'tabs', 'booking_offers', 'admin_dashboard')
 * @param enabled - Optional boolean gate (defaults to true) to pause auto-triggering while screen is loading
 * @param overrideSteps - Optional dynamic steps array to override the static tour configuration
 * @returns {UseTutorialGuideReturn} State and action handlers for CustomTutorialModal
 */
export const useTutorialGuide = (
    tourId: TutorialTourId,
    enabled: boolean = true,
    overrideSteps?: TutorialStep[]
): UseTutorialGuideReturn => {
    // Granular Zustand selectors to prevent unrelated store re-renders
    const uid = useAuthStore((s) => s.user?.uid || s.profile?.id || '');
    const role = useAuthStore((s) => s.role);
    const isAuthLoading = useAuthStore((s) => s.isLoading);
    const hasProfile = useAuthStore((s) => Boolean(s.profile));
    const dbTutorialComplete = useAuthStore((s) => s.profile?.onTutorialComplete);

    const effectiveTourConfig = useMemo((): TutorialTourConfig => {
        const baseConfig = TUTORIAL_TOURS[tourId];
        if (overrideSteps && overrideSteps.length > 0) {
            return {
                ...baseConfig,
                steps: overrideSteps,
            };
        }
        if (tourId === 'tabs' && Platform.OS === 'web') {
            return {
                ...baseConfig,
                steps: [...getWebNavTourSteps(role), createReplayHelpStep('Home')],
            };
        }
        return baseConfig;
    }, [tourId, role, overrideSteps]);

    const tourConfig = effectiveTourConfig;

    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(true);

    const storageKey = useMemo(() => {
        return uid ? `${STORAGE_KEY_PREFIX}${uid}` : '';
    }, [uid]);

    // Check if completed in Firestore `profile.onTutorialComplete`
    const isCompletedInDb = useMemo((): boolean => {
        const normalized = normalizeTutorialComplete(dbTutorialComplete);
        return Boolean(normalized.all || normalized[tourId]);
    }, [dbTutorialComplete, tourId]);

    useEffect(() => {
        let isMounted = true;
        let openTimer: ReturnType<typeof setTimeout> | null = null;

        const checkTutorialStatus = async (): Promise<void> => {
            if (isAuthLoading || !enabled || !uid || !hasProfile) {
                return;
            }

            // Fast path 1: Already marked complete on the Firestore User document (`onTutorialComplete`)
            if (isCompletedInDb) {
                if (isMounted) {
                    setHasCompletedTour(true);
                }
                return;
            }

            // Fast path 2: Check in-memory session cache for completion during current session
            const inMemoryMap = sessionCompletionCache.get(storageKey);
            const alreadyDone = Boolean(inMemoryMap?.[tourId]);

            if (!isMounted) return;

            setHasCompletedTour(alreadyDone);

            if (!alreadyDone) {
                openTimer = setTimeout(() => {
                    if (isMounted) {
                        setCurrentStepIndex(0);
                        setIsVisible(true);
                    }
                }, 250);
            }
        };

        void checkTutorialStatus();

        return () => {
            isMounted = false;
            if (openTimer) {
                clearTimeout(openTimer);
            }
        };
    }, [
        enabled,
        hasProfile,
        isAuthLoading,
        isCompletedInDb,
        storageKey,
        tourId,
        uid,
    ]);

    const markTourCompleted = useCallback(async (): Promise<void> => {
        setIsVisible(false);
        setHasCompletedTour(true);

        if (!uid || !storageKey) return;

        // 1. Update in-memory session cache immediately (0ms)
        const existingLocal = sessionCompletionCache.get(storageKey) || {};
        const updatedLocal: TutorialCompletionMap = {
            ...existingLocal,
            [tourId]: true,
        };
        sessionCompletionCache.set(storageKey, updatedLocal);

        // 2. Optimistically update `profile.onTutorialComplete` in `useAuthStore` so subsequent screens see it immediately
        const authState = useAuthStore.getState();
        if (authState.profile) {
            const currentTutorialMap = normalizeTutorialComplete(authState.profile.onTutorialComplete);
            if (!currentTutorialMap[tourId]) {
                authState.updateProfile({
                    ...authState.profile,
                    onTutorialComplete: {
                        ...currentTutorialMap,
                        [tourId]: true,
                    },
                });
            }
        }

        // 3. Persist to local AsyncStorage backup and Firestore `users/{uid}.onTutorialComplete`
        try {
            await Promise.all([
                AsyncStorage.setItem(storageKey, JSON.stringify(updatedLocal)),
                UserRepo.updateTutorialProgress(uid, tourId, true),
            ]);
        } catch {
            // Silently ignore offline/storage write errors
        }
    }, [storageKey, tourId, uid]);

    const totalSteps = tourConfig.steps.length;
    const safeIndex = Math.min(Math.max(currentStepIndex, 0), totalSteps - 1);
    const currentStep = tourConfig.steps[safeIndex];

    const onNextStep = useCallback(async (): Promise<void> => {
        if (safeIndex + 1 < totalSteps) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            await markTourCompleted();
        }
    }, [markTourCompleted, safeIndex, totalSteps]);

    const onPrevStep = useCallback((): void => {
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
    }, []);

    const onSkipTour = useCallback(async (): Promise<void> => {
        const lastStepIndex = totalSteps - 1;
        const lastStep = tourConfig.steps[lastStepIndex];

        // If skipping before the final '?' Replay Spotlight step, jump to the final '?' spotlight step first
        // so the user always sees where the '?' button is located before closing!
        if (lastStep?.highlightHeaderHelp && safeIndex < lastStepIndex) {
            setCurrentStepIndex(lastStepIndex);
            return;
        }

        await markTourCompleted();
    }, [markTourCompleted, safeIndex, totalSteps, tourConfig.steps]);

    const onReplayTour = useCallback((): void => {
        setCurrentStepIndex(0);
        setIsVisible(true);

        if (tourId === 'booking' || tourId === 'booking_offers' || tourId === 'booking_details') {
            if (storageKey) {
                const cached = sessionCompletionCache.get(storageKey);
                if (cached) {
                    const updated = { ...cached };
                    delete updated.legal_terms;
                    sessionCompletionCache.set(storageKey, updated);
                    void AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
                }
            }
            if (uid) {
                void UserRepo.updateTutorialProgress(uid, 'legal_terms', false).catch(() => {});
            }
        }
    }, [storageKey, tourId, uid]);

    return {
        isVisible,
        currentStepIndex: safeIndex,
        currentStep,
        totalSteps,
        tourConfig,
        hasCompletedTour,
        onNextStep,
        onPrevStep,
        onSkipTour,
        onReplayTour,
    };
};
