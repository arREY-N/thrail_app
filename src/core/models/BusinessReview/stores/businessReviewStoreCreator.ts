
import { useBusinessesStore } from "@/src/core/models/Business/Business";
import { BusinessReview } from "@/src/core/models/BusinessReview/interfaces/BusinessReview";
import { BusinessReviewRepo } from "@/src/core/models/BusinessReview/repositories/BusinessReviewRepository";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { Unsubscribe } from "firebase/firestore";
import { StateCreator } from "zustand";

export interface BusinessReviewState {
    isLoading: boolean;
    isFetching: boolean;
    isWriting: boolean;
    error: Error | null;
    subscriptionError: Error | null;

    fetchAll: () => Promise<void>;
    fetchByBusiness: (businessId: string) => Promise<void>,
    fetchByReviewId: (reviewId: string, businessId?: string) => Promise<BusinessReview | null>,
    subscribeToBusinessReviews: (businessId: string) => Unsubscribe;
    reset: () => void;
    data: BusinessReview[];
    reviewsByBusiness: Record<string, BusinessReview[]>;
    refresh: () => Promise<void>
    refreshBusiness: (businessId: string) => Promise<void>,
    write: (data: BusinessReview) => Promise<BusinessReview | undefined>;
    likeBusinessReview: (review: BusinessReview) => Promise<void>;
    delete: (businessId: string, reviewId: string) => Promise<void>;
}

const activeBusinessReviewListeners = new Map<string, Unsubscribe>();
const businessReviewListenerCounts = new Map<string, number>();

const releaseBusinessReviewListener = (businessId: string, targetListener: Unsubscribe): void => {
    if (activeBusinessReviewListeners.get(businessId) !== targetListener) {
        return;
    }

    const currentCount = businessReviewListenerCounts.get(businessId) ?? 0;
    if (currentCount <= 1) {
        try {
            targetListener();
        } catch (err) {
            console.error('Error unsubscribing business review listener:', err);
        }
        activeBusinessReviewListeners.delete(businessId);
        businessReviewListenerCounts.delete(businessId);
    } else {
        businessReviewListenerCounts.set(businessId, currentCount - 1);
    }
};

const init = {
    isLoading: false,
    isFetching: false,
    isWriting: false,
    error: null,
    subscriptionError: null,

    data: [],
    reviewsByBusiness: {},
}

export const businessReviewStoreCreator: StateCreator<
    BusinessReviewState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    reset: () => {
        activeBusinessReviewListeners.forEach((unsub) => {
            try {
                unsub();
            } catch (err) {
                console.error('Error resetting business review listener:', err);
            }
        });
        activeBusinessReviewListeners.clear();
        businessReviewListenerCounts.clear();
        set(init);
    },

    subscribeToBusinessReviews: (businessId: string): Unsubscribe => {
        if (!businessId) {
            return () => {};
        }

        const existingListener = activeBusinessReviewListeners.get(businessId);
        if (existingListener) {
            businessReviewListenerCounts.set(
                businessId,
                (businessReviewListenerCounts.get(businessId) ?? 0) + 1
            );
            let isReleased = false;
            return () => {
                if (isReleased) return;
                isReleased = true;
                releaseBusinessReviewListener(businessId, existingListener);
            };
        }

        const hasCached = Boolean(get().reviewsByBusiness[businessId]);
        if (!hasCached) {
            set({ isFetching: true, subscriptionError: null });
        } else {
            set({ subscriptionError: null });
        }

        try {
            const unsubscribe = BusinessReviewRepo.listenToBusinessReviews(
                businessId,
                (businessReviews) => {
                    set((state) => {
                        const otherReviews = state.data.filter(
                            (r) => r.business?.id !== businessId
                        );
                        return {
                            isFetching: false,
                            subscriptionError: null,
                            data: [...otherReviews, ...businessReviews],
                            reviewsByBusiness: {
                                ...state.reviewsByBusiness,
                                [businessId]: businessReviews,
                            },
                        };
                    });

                    // Keep BusinessSpotlightCard & Business cache synchronized from the active review stream
                    if (businessReviews.length < 30) {
                        const validRatings = businessReviews
                            .map((r) => Number(r.rating))
                            .filter((val) => !isNaN(val) && val > 0);
                        const nextRating = validRatings.length > 0
                            ? validRatings.reduce((sum, val) => sum + val, 0) / validRatings.length
                            : 0;
                        const nextReviewCount = businessReviews.length;

                        const bizSnap = useBusinessesStore.getState();
                        const targetInData = bizSnap.data.find((b) => b.id === businessId);
                        const needsCurrentSync = Boolean(
                            bizSnap.current &&
                            bizSnap.current.id === businessId &&
                            (bizSnap.current.rating !== nextRating ||
                                bizSnap.current.reviewCount !== nextReviewCount)
                        );
                        const needsDataSync = Boolean(
                            targetInData &&
                            (targetInData.rating !== nextRating ||
                                targetInData.reviewCount !== nextReviewCount)
                        );

                        if (needsCurrentSync || needsDataSync) {
                            useBusinessesStore.setState((bizState) => {
                                if (needsCurrentSync && bizState.current && bizState.current.id === businessId) {
                                    bizState.current.rating = nextRating;
                                    bizState.current.reviewCount = nextReviewCount;
                                }
                                if (needsDataSync) {
                                    const idx = bizState.data.findIndex((b) => b.id === businessId);
                                    if (idx !== -1) {
                                        bizState.data[idx].rating = nextRating;
                                        bizState.data[idx].reviewCount = nextReviewCount;
                                    }
                                }
                            });
                        }
                    }
                },
                (err) => {
                    console.error('Error in business reviews subscription:', err);
                    set({
                        isFetching: false,
                        subscriptionError: err,
                    });
                }
            );

            activeBusinessReviewListeners.set(businessId, unsubscribe);
            businessReviewListenerCounts.set(businessId, 1);

            let isReleased = false;
            return () => {
                if (isReleased) return;
                isReleased = true;
                releaseBusinessReviewListener(businessId, unsubscribe);
            };
        } catch (err: unknown) {
            const normalized = err instanceof Error
                ? err
                : new Error('Failed subscribing to business reviews');
            console.error('Error subscribing to business reviews:', normalized);
            set({
                isFetching: false,
                subscriptionError: normalized,
            });
            return () => {};
        }
    },

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

    likeBusinessReview: async (review: BusinessReview) => {
        const bId = review.business?.id;
        if (!bId || !review.id) return;

        const targetLikes = Array.isArray(review.likes) ? review.likes : [];
        const previousFromMap =
            get().reviewsByBusiness[bId]?.find((r) => r.id === review.id) || null;
        const previousFromData = get().data.find((r) => r.id === review.id) || null;
        const previousReview = previousFromMap || previousFromData;

        const optimisticReview: BusinessReview = {
            ...review,
            likes: targetLikes,
            updatedAt: new Date(),
        };

        set((state) => {
            const currentBizReviews = state.reviewsByBusiness[bId] || [];
            return {
                error: null,
                data: upsertItem(state.data, optimisticReview),
                reviewsByBusiness: {
                    ...state.reviewsByBusiness,
                    [bId]: upsertItem(currentBizReviews, optimisticReview),
                },
            };
        });

        try {
            await BusinessReviewRepo.updateLikes(bId, review.id, targetLikes);
        } catch (error) {
            if (previousReview) {
                set((state) => {
                    const currentInMap = state.reviewsByBusiness[bId]?.find(
                        (r) => r.id === review.id
                    );
                    const currentInData = state.data.find((r) => r.id === review.id);
                    const currentLikes = currentInMap?.likes ?? currentInData?.likes;

                    // Preserve any newer optimistic toggle that superseded this failed write
                    if (currentLikes !== targetLikes) {
                        return { error: error as Error };
                    }

                    const currentBizReviews = state.reviewsByBusiness[bId] || [];
                    return {
                        error: error as Error,
                        data: upsertItem(state.data, previousReview),
                        reviewsByBusiness: {
                            ...state.reviewsByBusiness,
                            [bId]: upsertItem(currentBizReviews, previousReview),
                        },
                    };
                });
            } else {
                set({ error: error as Error });
            }
            throw error;
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