
import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { BusinessReview } from "@/src/core/models/BusinessReview/interfaces/BusinessReview";
import { BusinessReviewRepo } from "@/src/core/models/BusinessReview/repositories/BusinessReviewRepository";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { StateCreator } from "zustand";

export interface BusinessReviewState {
    isLoading: boolean;
    isFetching: boolean;
    isWriting: boolean;
    error: Error | null;

    fetchAll: () => Promise<void>;
    fetchByBusiness: (businessId: string) => Promise<void>,
    fetchByReviewId: (reviewId: string, businessId?: string) => Promise<BusinessReview | null>,
    data: BusinessReview[];
    reviewsByBusiness: Record<string, BusinessReview[]>;
    refresh: () => Promise<void>
    refreshBusiness: (businessId: string) => Promise<void>,
    write: (data: BusinessReview) => Promise<BusinessReview | undefined>;
    delete: (businessId: string, reviewId: string) => Promise<void>;
}

const init = {
    isLoading: false,
    isFetching: false,
    isWriting: false,
    error: null,

    data: [],
    reviewsByBusiness: {},
}

export const businessReviewStoreCreator: StateCreator<
    BusinessReviewState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    fetchAll: async () => {
        try {
            if (get().data.length > 0) {
                return;
            }
            set({ isFetching: true, error: null })
            const reviews = await BusinessReviewRepo.fetchAll();

            set({
                isFetching: false,
                data: reviews
            })
        } catch (error) {
            set({ error: error as Error })
        } finally {
            set({ isFetching: false })
        }
    },

    fetchByBusiness: async (businessId: string) => {
        try {
            if (get().reviewsByBusiness[businessId]) {
                return;
            }
            set({ isFetching: true, error: null })

            const businessReviews = await BusinessReviewRepo.fetchAllBusinessReviews(businessId);

            set((state) => {
                let mergedData = [...state.data];
                for (const item of businessReviews) {
                    mergedData = upsertItem(mergedData, item);
                }
                return {
                    isFetching: false,
                    data: mergedData,
                    reviewsByBusiness: {
                        ...state.reviewsByBusiness,
                        [businessId]: businessReviews
                    }
                };
            })
        } catch (error) {
            set({ error: error as Error })
        } finally {
            set({ isFetching: false })
        }
    },

    fetchByReviewId: async (reviewId: string, businessId?: string) => {
        try {
            if (!reviewId) return null;
            set({ isFetching: true, error: null })

            let review: BusinessReview | null =
                get().data.find(d => d.id === reviewId || d.hikeReview?.id === reviewId) || null;

            if (!review && businessId) {
                review = await BusinessReviewRepo.fetchById(businessId, reviewId);
                if (review) {
                    set((state) => ({
                        data: upsertItem(state.data, review!),
                    }));
                }
            }

            set({
                isFetching: false,
            })
            return review;
        } catch (error) {
            set({ error: error as Error })
            return null;
        } finally {
            set({ isFetching: false })
        }
    },

    refresh: async () => {
        try {
            set({ isFetching: true, error: null })
            const reviews = await BusinessReviewRepo.fetchAll();

            set({
                isFetching: false,
                data: reviews
            })
        } catch (error) {
            set({ error: error as Error })
        } finally {
            set({ isFetching: false })
        }
    },

    refreshBusiness: async (businessId: string) => {
        try {
            set({ isFetching: true, error: null })

            const businessReviews = await BusinessReviewRepo.fetchAllBusinessReviews(businessId);

            set((state) => {
                const otherReviews = state.data.filter(r => r.business.id !== businessId);
                return {
                    isFetching: false,
                    data: [...otherReviews, ...businessReviews],
                    reviewsByBusiness: {
                        ...state.reviewsByBusiness,
                        [businessId]: businessReviews
                    }
                };
            })
        } catch (error) {
            set({ error: error as Error })
        } finally {
            set({ isFetching: false })
        }
    },

    write: async (data: BusinessReview) => {
        try {
            set({ isWriting: true, error: null })

            const targetId = data.id || data.hikeReview?.id || '';
            let existing = get().data.find(
                r => (targetId && r.id === targetId) || (data.hikeReview?.id && r.hikeReview?.id === data.hikeReview.id)
            ) || null;

            if (!existing && targetId && data.business?.id) {
                existing = await BusinessReviewRepo.fetchById(data.business.id, targetId);
            }

            const oldRating = existing ? existing.rating : null;

            const payload: BusinessReview = existing
                ? { ...data, id: existing.id, createdAt: existing.createdAt }
                : { ...data, id: targetId };

            const businessReview = await BusinessReviewRepo.write(payload);

            set((state) => {
                const bId = businessReview.business.id;
                const currentBizReviews = state.reviewsByBusiness[bId] || [];
                return {
                    isWriting: false,
                    data: upsertItem(state.data, businessReview),
                    reviewsByBusiness: {
                        ...state.reviewsByBusiness,
                        [bId]: upsertItem(currentBizReviews, businessReview),
                    }
                };
            });

            if (businessReview.business?.id) {
                useBusinessesStore.getState().applyRatingDelta(
                    businessReview.business.id,
                    oldRating,
                    businessReview.rating
                );
            }

            return businessReview;
        } catch (error) {
            set({ error: error as Error })
            throw error;
        } finally {
            set({ isWriting: false })
        }
    },

    delete: async (businessId: string, reviewId: string) => {
        try {
            set({ isLoading: true, error: null })

            let existing = get().data.find(r => r.id === reviewId) || null;
            if (!existing && businessId && reviewId) {
                existing = await BusinessReviewRepo.fetchById(businessId, reviewId);
            }
            const oldRating = existing ? existing.rating : null;

            await BusinessReviewRepo.delete(businessId, reviewId);

            set((state) => {
                const currentBizReviews = state.reviewsByBusiness[businessId] || [];
                return {
                    isLoading: false,
                    data: state.data.filter(r => r.id !== reviewId),
                    reviewsByBusiness: {
                        ...state.reviewsByBusiness,
                        [businessId]: currentBizReviews.filter(r => r.id !== reviewId),
                    }
                };
            })

            if (businessId && oldRating !== null) {
                useBusinessesStore.getState().applyRatingDelta(businessId, oldRating, null);
            }
        } catch (error) {
            set({ error: error as Error })
        } finally {
            set({ isLoading: false })
        }
    },

})