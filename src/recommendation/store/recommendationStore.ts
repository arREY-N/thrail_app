import { Hike, HikeRepo } from "@/src/core/models/Hike/Hike";
import { Review, ReviewRepo } from "@/src/core/models/Review/Review";
import { User, useUserStore } from "@/src/core/models/User/User";
import { normalizeHike, normalizeReview } from "@/src/recommendation/utilities/normalization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface RecommendationHikeState {
    data: Hike[];
    isLoading: boolean;
    error: string | null;
    fetchAll: (users?: User[]) => Promise<Hike[]>;
    refresh: (users?: User[]) => Promise<Hike[]>;
    clear: () => void;
}

export interface RecommendationReviewState {
    data: Review[];
    isLoading: boolean;
    error: string | null;
    fetchAll: () => Promise<Review[]>;
    refresh: () => Promise<Review[]>;
    clear: () => void;
}

/**
 * Dedicated recommendation hike store with AsyncStorage persistence.
 * Prevents redundant Firestore queries on app reload/hot-refresh while keeping
 * hikes segregated from the active user's tracking session store.
 */
export const useRecommendationHikeStore = create<RecommendationHikeState>()(
    persist(
        immer((set, get) => ({
            data: [],
            isLoading: false,
            error: null,
            clear: () => set({ data: [], error: null, isLoading: false }),

            fetchAll: async (users?: User[]) => {
                if (get().data.length > 0) return get().data;

                set({ isLoading: true, error: null });
                try {
                    let targetUsers = users;
                    if (!targetUsers || targetUsers.length === 0) {
                        const userStore = useUserStore.getState();
                        if (userStore.data.length === 0) {
                            await userStore.fetchAll();
                        }
                        targetUsers = useUserStore.getState().data;
                    }

                    const rawHikes = await HikeRepo.fetchAllFromUsers(targetUsers);
                    const parsedHikes = rawHikes.map((h) => normalizeHike(h));

                    set({ data: parsedHikes, isLoading: false });
                    return parsedHikes;
                } catch (err) {
                    const message = (err as Error).message || "Failed to fetch all users' hikes";
                    console.error("Error in useRecommendationHikeStore.fetchAll:", err);
                    set({ error: message, isLoading: false });
                    return [];
                }
            },

            refresh: async (users?: User[]) => {
                set({ isLoading: true, error: null });
                try {
                    let targetUsers = users;
                    if (!targetUsers || targetUsers.length === 0) {
                        targetUsers = useUserStore.getState().data;
                    }

                    const rawHikes = await HikeRepo.fetchAllFromUsers(targetUsers);
                    const parsedHikes = rawHikes.map((h) => normalizeHike(h));

                    set({ data: parsedHikes, isLoading: false });
                    return parsedHikes;
                } catch (err) {
                    const message = (err as Error).message || "Failed to refresh users' hikes";
                    console.error("Error in useRecommendationHikeStore.refresh:", err);
                    set({ error: message, isLoading: false });
                    return [];
                }
            },
        })),
        {
            name: "recommendation-hikes-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                data: state.data,
            }),
            onRehydrateStorage: () => (state) => {
                if (state && Array.isArray(state.data)) {
                    state.data = state.data.map((h) => normalizeHike(h));
                }
            },
        }
    )
);

/**
 * Dedicated recommendation review store with AsyncStorage persistence.
 * Caches all user reviews locally with 0 redundant Firestore queries on reload.
 */
export const useRecommendationReviewStore = create<RecommendationReviewState>()(
    persist(
        immer((set, get) => ({
            data: [],
            isLoading: false,
            error: null,
            clear: () => set({ data: [], error: null, isLoading: false }),

            fetchAll: async () => {
                if (get().data.length > 0) return get().data;

                set({ isLoading: true, error: null });
                try {
                    const rawReviews = await ReviewRepo.retrieveAll();
                    const parsedReviews = rawReviews.map((r) => normalizeReview(r));

                    set({ data: parsedReviews, isLoading: false });
                    return parsedReviews;
                } catch (err) {
                    const message = (err as Error).message || "Failed to fetch all reviews";
                    console.error("Error in useRecommendationReviewStore.fetchAll:", err);
                    set({ error: message, isLoading: false });
                    return [];
                }
            },

            refresh: async () => {
                set({ isLoading: true, error: null });
                try {
                    const rawReviews = await ReviewRepo.retrieveAll();
                    const parsedReviews = rawReviews.map((r) => normalizeReview(r));

                    set({ data: parsedReviews, isLoading: false });
                    return parsedReviews;
                } catch (err) {
                    const message = (err as Error).message || "Failed to refresh reviews";
                    console.error("Error in useRecommendationReviewStore.refresh:", err);
                    set({ error: message, isLoading: false });
                    return [];
                }
            },
        })),
        {
            name: "recommendation-reviews-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                data: state.data,
            }),
            onRehydrateStorage: () => (state) => {
                if (state && Array.isArray(state.data)) {
                    state.data = state.data.map((r) => normalizeReview(r));
                }
            },
        }
    )
);
