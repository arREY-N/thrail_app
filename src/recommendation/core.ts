import { Hike } from "@/src/core/models/Hike/Hike";
import { Review } from "@/src/core/models/Review/Review";
import { useTrailStore } from "@/src/core/models/Trail/Trail";
import { User, useUserStore } from "@/src/core/models/User/User";
import { UserProfiles } from "@/src/recommendation/interfaces/Profile";
import {
    useRecommendationHikeStore,
    useRecommendationReviewStore,
} from "@/src/recommendation/store/recommendationStore";
import { GenerateUserProfile } from "@/src/recommendation/utilities/CreateProfile";
import { DataSet } from "@/src/recommendation/utilities/dataPreparation";
import { getTrailStartElevations } from "@/src/recommendation/utilities/GetElevation";
import { normalizeTrails, resolveOrGenerateTrailProfiles } from "@/src/recommendation/utilities/NormalizeTrails";
import { useCallback, useEffect, useMemo, useState } from "react";

// Re-export utility functions, stores, and types for seamless backwards compatibility
export * from "@/src/recommendation/store/recommendationStore";
export * from "@/src/recommendation/utilities/CreateProfile";
export * from "@/src/recommendation/utilities/dataPreparation";
export * from "@/src/recommendation/utilities/normalization";

export interface RecommendationCoreState extends DataSet {
    startElevations: Record<string, number>;
    isElevationsLoading: boolean;
    isSyncingProfiles: boolean;
    missingProfilesCount: number;
    isLoading: boolean;
    error: Error | null;
    refresh: (options?: { forceRecalculate?: boolean }) => Promise<void>;
    syncProfilesToFirestore: (forceRecalculate?: boolean) => Promise<boolean>;
    generateUserProfile: (user: User) => UserProfiles;
    saveUserProfile: (id: string, profile: UserProfiles) => Promise<boolean>;
}

/**
 * Core recommendation hook for React UI screens.
 * Subscribes to the app's persistent Zustand stores (backed by AsyncStorage).
 *
 * Benefits:
 * - On app reload or hot-refresh, data is instantly served from local cache with 0 Firestore reads.
 * - Real-time reactive updates if trail, user, hike, or review stores change elsewhere in the app.
 * - Uses saved normalized profiles directly from trail documents when available.
 * - Explicit fresh data fetches only trigger when calling `refresh()` (e.g. via the header button).
 */
export default function Core(): RecommendationCoreState {
    const trails = useTrailStore((s) => s.data);
    const users = useUserStore((s) => s.data);
    const hikes = useRecommendationHikeStore((s) => s.data);
    const reviews = useRecommendationReviewStore((s) => s.data);

    const isTrailLoading = useTrailStore((s) => s.isLoading);
    const isUserLoading = useUserStore((s) => s.isLoading);
    const isHikeLoading = useRecommendationHikeStore((s) => s.isLoading);
    const isReviewLoading = useRecommendationReviewStore((s) => s.isLoading);

    const trailError = useTrailStore((s) => s.error);
    const userError = useUserStore((s) => s.error);
    const hikeError = useRecommendationHikeStore((s) => s.error);
    const reviewError = useRecommendationReviewStore((s) => s.error);

    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isSyncingProfiles, setIsSyncingProfiles] = useState<boolean>(false);
    const [startElevations, setStartElevations] = useState<Record<string, number>>({});
    const [isElevationsLoading, setIsElevationsLoading] = useState<boolean>(false);

    // Initial load: Only fetch from Firestore if cache is empty
    useEffect(() => {
        const loadInitial = async () => {
            const promises: Promise<unknown>[] = [];
            if (useTrailStore.getState().data.length === 0) {
                promises.push(useTrailStore.getState().fetchAll());
            }
            if (useUserStore.getState().data.length === 0) {
                promises.push(useUserStore.getState().fetchAll());
            }
            if (useRecommendationReviewStore.getState().data.length === 0) {
                promises.push(useRecommendationReviewStore.getState().fetchAll());
            }
            if (promises.length > 0) {
                await Promise.all(promises);
            }

            if (useRecommendationHikeStore.getState().data.length === 0) {
                await useRecommendationHikeStore.getState().fetchAll(useUserStore.getState().data);
            }
        };

        loadInitial();
    }, []);

    // Fetch start elevations when trails change, but only if some trails lack profiles
    useEffect(() => {
        if (!trails || trails.length === 0) return;

        // Skip fetching external elevations if all trails already have saved profiles
        const hasMissingProfiles = trails.some((t) => !t.profile);
        if (!hasMissingProfiles) {
            return;
        }

        let isMounted = true;
        setIsElevationsLoading(true);

        getTrailStartElevations(trails)
            .then((map) => {
                if (isMounted) {
                    setStartElevations(map);
                }
            })
            .catch((err) => {
                console.warn("Failed fetching start elevations in core:", err);
            })
            .finally(() => {
                if (isMounted) {
                    setIsElevationsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [trails]);

    // Manual refresh: explicitly triggers Firestore queries through store refresh methods
    const refresh = useCallback(async (options?: { forceRecalculate?: boolean }) => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                useTrailStore.getState().refresh(),
                useUserStore.getState().refresh(),
                useRecommendationReviewStore.getState().refresh(),
            ]);
            await useRecommendationHikeStore.getState().refresh(useUserStore.getState().data);
            const freshTrails = useTrailStore.getState().data;

            if (options?.forceRecalculate || freshTrails.some((t) => !t.profile)) {
                const freshElevations = await getTrailStartElevations(freshTrails);
                setStartElevations(freshElevations);
            }
        } catch (err) {
            console.error("Error refreshing recommendation dataset:", err);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Batch saves generated/recalculated profiles to Firestore
    const syncProfilesToFirestore = useCallback(
        async (forceRecalculate = false): Promise<boolean> => {
            setIsSyncingProfiles(true);
            try {
                let elevations = startElevations;
                if (forceRecalculate || trails.some((t) => !t.profile)) {
                    elevations = await getTrailStartElevations(trails);
                    setStartElevations(elevations);
                }

                const result = resolveOrGenerateTrailProfiles(trails, {
                    elevationsMap: elevations,
                    forceRecalculate,
                });

                if (result.updatesToSave.length > 0) {
                    const success = await useTrailStore.getState().saveBatchTrailProfiles(result.updatesToSave);
                    return success;
                }

                return true;
            } catch (err) {
                console.error("Error syncing profiles to Firestore:", err);
                return false;
            } finally {
                setIsSyncingProfiles(false);
            }
        },
        [trails, startElevations]
    );

    // Active loading if refreshing or if cache is empty and actively fetching
    const isLoading =
        isRefreshing ||
        isSyncingProfiles ||
        (trails.length === 0 && isTrailLoading) ||
        (users.length === 0 && isUserLoading) ||
        (hikes.length === 0 && isHikeLoading) ||
        (reviews.length === 0 && isReviewLoading);

    const rawError = trailError || userError || hikeError || reviewError;
    const error = rawError ? new Error(rawError) : null;

    const hikesByUser = useMemo(() => {
        const map: Record<string, Hike[]> = {};
        for (const hike of hikes) {
            const userId = hike.user?.id;
            if (userId) {
                if (!map[userId]) map[userId] = [];
                map[userId].push(hike);
            }
        }
        return map;
    }, [hikes]);

    const reviewsByUser = useMemo(() => {
        const map: Record<string, Review[]> = {};
        for (const review of reviews) {
            const userId = review.user?.id;
            if (userId) {
                if (!map[userId]) map[userId] = [];
                map[userId].push(review);
            }
        }
        return map;
    }, [reviews]);

    const reviewsByTrail = useMemo(() => {
        const map: Record<string, Review[]> = {};
        for (const review of reviews) {
            const trailId = review.trail?.id;
            if (trailId) {
                if (!map[trailId]) map[trailId] = [];
                map[trailId].push(review);
            }
        }
        return map;
    }, [reviews]);

    const normalizedTrails = useMemo(() => {
        return normalizeTrails(trails, startElevations);
    }, [trails, startElevations]);

    const resolvedProfileData = useMemo(() => {
        return resolveOrGenerateTrailProfiles(trails, {
            elevationsMap: startElevations,
            forceRecalculate: false,
        });
    }, [trails, startElevations]);

    const trailProfiles = resolvedProfileData.profiles;
    const missingProfilesCount = resolvedProfileData.missingCount;

    const generateUserProfile = useCallback(
        (user: User): UserProfiles => {
            if (user.profile) return user.profile;
            return GenerateUserProfile(user, trails, startElevations);
        },
        [trails, startElevations]
    );

    const saveUserProfile = useCallback(
        async (id: string, profile: UserProfiles): Promise<boolean> => {
            return useUserStore.getState().saveUserProfile(id, profile);
        },
        []
    );

    return {
        trails,
        normalizedTrails,
        trailProfiles,
        startElevations,
        isElevationsLoading,
        isSyncingProfiles,
        missingProfilesCount,
        users,
        hikes,
        reviews,
        hikesByUser,
        reviewsByUser,
        reviewsByTrail,
        isLoading: isLoading || isElevationsLoading,
        error,
        refresh,
        syncProfilesToFirestore,
        generateUserProfile,
        saveUserProfile,
    };
}

export { Core as useRecommendationCore };

