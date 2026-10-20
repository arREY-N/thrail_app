import { Hike } from "@/src/core/models/Hike/Hike";
import { Review } from "@/src/core/models/Review/Review";
import { Trail, useTrailStore } from "@/src/core/models/Trail/Trail";
import { useUserStore } from "@/src/core/models/User/User";
import {
    useRecommendationHikeStore,
    useRecommendationReviewStore,
} from "@/src/recommendation/store/recommendationStore";
import { DataSet } from "@/src/recommendation/utilities/dataPreparation";
import { getTrailStartElevations } from "@/src/recommendation/utilities/GetElevation";
import { buildTrailProfiles, normalizeTrails } from "@/src/recommendation/utilities/NormalizeTrails";
import { useCallback, useEffect, useMemo, useState } from "react";

// Re-export utility functions, stores, and types for seamless backwards compatibility
export * from "@/src/recommendation/store/recommendationStore";
export * from "@/src/recommendation/utilities/dataPreparation";
export * from "@/src/recommendation/utilities/normalization";

export interface RecommendationCoreState extends DataSet {
    startElevations: Record<string, number>;
    isElevationsLoading: boolean;
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

/**
 * Core recommendation hook for React UI screens.
 * Subscribes to the app's persistent Zustand stores (backed by AsyncStorage).
 *
 * Benefits:
 * - On app reload or hot-refresh, data is instantly served from local cache with 0 Firestore reads.
 * - Real-time reactive updates if trail, user, hike, or review stores change elsewhere in the app.
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

    // Fetch start elevations when trails change
    useEffect(() => {
        if (!trails || trails.length === 0) return;

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
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                useTrailStore.getState().refresh(),
                useUserStore.getState().refresh(),
                useRecommendationReviewStore.getState().refresh(),
            ]);
            await useRecommendationHikeStore.getState().refresh(useUserStore.getState().data);
            const freshTrails = useTrailStore.getState().data;
            const freshElevations = await getTrailStartElevations(freshTrails);
            setStartElevations(freshElevations);
        } catch (err) {
            console.error("Error refreshing recommendation dataset:", err);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Active loading if refreshing or if cache is empty and actively fetching
    const isLoading =
        isRefreshing ||
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

    const trailProfiles = useMemo(() => {
        return buildTrailProfiles(trails, startElevations);
    }, [trails, startElevations]);

    return {
        trails,
        normalizedTrails,
        trailProfiles,
        startElevations,
        isElevationsLoading,
        users,
        hikes,
        reviews,
        hikesByUser,
        reviewsByUser,
        reviewsByTrail,
        isLoading: isLoading || isElevationsLoading,
        error,
        refresh,
    };
}

export { Core as useRecommendationCore };
