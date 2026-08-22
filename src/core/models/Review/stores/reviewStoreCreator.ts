import { ReviewRepo } from "@/src/core/init/repositories";
import { Review } from "@/src/core/models/Review/interfaces/Review.types";
import { Unsubscribe } from "firebase/firestore";
import { StateCreator } from "zustand";

export interface ReviewState {
    reviews: Review[];
    isLoading: boolean;
    error: string | null;

    subscribeToReviews: () => Unsubscribe | null;
    unsubscribeFromReviews: () => void;

    fetchAll: () => Promise<void>;
    refresh: () => Promise<void>;
    fetchByUserId: (userId: string) => Promise<void>;
    load: (id: string) => Promise<Review | null>;
    create: (review: Review) => Promise<void>;
    remove: (id: string) => Promise<void>;
    likeReview: (review: Review) => Promise<void>;
}

let activeReviewsUnsubscribe: Unsubscribe | null = null;

const init = {
    reviews: [],
    isLoading: false,
    error: null,
};

export const reviewStoreCreator: StateCreator<
    ReviewState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    subscribeToReviews: () => {
        if (activeReviewsUnsubscribe) {
            activeReviewsUnsubscribe();
            activeReviewsUnsubscribe = null;
        }

        set({ isLoading: true });
        try {
            const unsubscribe = ReviewRepo.listenToReviews(
                (reviews) => set({
                    reviews,
                    isLoading: false,
                })
            );

            activeReviewsUnsubscribe = unsubscribe;
            return () => {
                if (activeReviewsUnsubscribe === unsubscribe) {
                    activeReviewsUnsubscribe();
                    activeReviewsUnsubscribe = null;
                } else {
                    unsubscribe();
                }
            };
        } catch (error) {
            console.error('Error subscribing to reviews: ', error);
            set({ isLoading: false });
            throw error;
        }
    },

    unsubscribeFromReviews: () => {
        if (activeReviewsUnsubscribe) {
            activeReviewsUnsubscribe();
            activeReviewsUnsubscribe = null;
        }
    },

    fetchAll: async () => {
        set({ isLoading: true, error: null });

        try {
            if (get().reviews.length > 0) {
                set({ isLoading: false });
                return;
            }

            const reviews = await ReviewRepo.fetchAll(true);
            set({ reviews, isLoading: false });
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message ?? 'Failed to load reviews', isLoading: false });
        }
    },

    refresh: async () => {
        set({ isLoading: true, error: null });

        try {
            const reviews = await ReviewRepo.fetchAll(true);
            set({ reviews, isLoading: false });
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message ?? 'Failed to load reviews', isLoading: false });
        }
    },

    load: async (id: string): Promise<Review | null> => {
        set({ isLoading: true, error: null });

        try {
            let review: Review | null = null;

            if (get().reviews.some(r => r.id === id)) {
                review = get().reviews.find(r => r.id === id) || null;

                if (review) {
                    set({ isLoading: false });
                    return review;
                }
            }

            if (!review) {
                review = await ReviewRepo.fetchById(id);
            }

            if (!review) {
                set({ error: 'Review not found', isLoading: false });
                return null;
            }

            set({
                reviews: [...get().reviews.filter(r => r.id !== id), review],
                isLoading: false,
            });

            return review;
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message ?? 'Failed to load review', isLoading: false });
            return null;
        }
    },

    likeReview: async (review: Review): Promise<void> => {
        const response = await ReviewRepo.write(review);
        set((state) => {
            const index = state.reviews.findIndex(r => r.id === review.id);
            if (index !== -1) {
                state.reviews[index] = response;
            }
        });
    },

    fetchByUserId: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
            const reviews = await ReviewRepo.fetchByUserId(userId, true);
            set({ reviews, isLoading: false });
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message ?? 'Failed to load reviews', isLoading: false });
        }
    },

    create: async (review: Review) => {
        set({ isLoading: true, error: null });
        try {
            const newReviewItem = await ReviewRepo.write(review);
            set((state) => {
                if (review.id) {
                    const index = state.reviews.findIndex(r => r.id === review.id);
                    if (index !== -1) state.reviews[index] = newReviewItem;
                } else {
                    state.reviews.push(newReviewItem);
                }

                state.reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                state.isLoading = false;
            });
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message ?? 'Failed to create review', isLoading: false });
        }
    },

    remove: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
            await ReviewRepo.delete(id);

            set((state) => {
                const index = state.reviews.findIndex(r => r.id === id);

                if (index !== -1) {
                    state.reviews.splice(index, 1);
                }

                state.isLoading = false;
            });
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message ?? 'Failed to delete review', isLoading: false });
        }
    },
});
