import { Review } from "@/src/core/models/Review/interfaces/Review.types";
import { ReviewRepo } from "@/src/core/models/Review/repositories/ReviewRepository";
import { upsertItem } from "@/src/core/models/utils/upsert";
import NetInfo from "@react-native-community/netinfo";
import { Unsubscribe } from "firebase/firestore";
import { Platform } from "react-native";
import { StateCreator } from "zustand";

export interface ReviewState {
    reviews: Review[];
    isLoading: boolean;
    error: string | null;

    subscribeToReviews: () => Unsubscribe | null;
    unsubscribeFromReviews: () => void;
    reset: () => void;

    fetchAll: () => Promise<void>;
    refresh: () => Promise<void>;
    fetchByUserId: (userId: string) => Promise<void>;
    load: (id: string) => Promise<Review | null>;
    create: (review: Review) => Promise<void>;
    remove: (id: string) => Promise<void>;
    likeReview: (review: Review) => Promise<void>;
    retrieveAll: () => Promise<Review[]>;
}

let activeReviewsUnsubscribe: Unsubscribe | null = null;
let reviewSubscribersCount = 0;

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

    reset: () => {
        get().unsubscribeFromReviews();
        set(init);
    },

    subscribeToReviews: () => {
        reviewSubscribersCount++;

        const hasCached = get().reviews.length > 0;
        if (!hasCached) {
            set({ isLoading: true });
        }
        set({ error: null });

        if (Platform.OS !== 'web') {
            NetInfo.fetch().then((network) => {
                const isOnline = Boolean(network.isConnected && network.isInternetReachable);
                if (!isOnline) {
                    set({ isLoading: false });
                }
            });
        }

        if (activeReviewsUnsubscribe) {
            return () => {
                reviewSubscribersCount = Math.max(0, reviewSubscribersCount - 1);
                if (reviewSubscribersCount === 0 && activeReviewsUnsubscribe) {
                    activeReviewsUnsubscribe();
                    activeReviewsUnsubscribe = null;
                }
            };
        }

        try {
            const unsubscribe = ReviewRepo.listenToReviews(
                (reviews) => {
                    set({
                        reviews: reviews ?? [],
                        isLoading: false,
                    });
                },
                (error) => {
                    console.error('Error in listenToReviews: ', error);
                    set({
                        isLoading: false,
                        error: get().reviews.length === 0 ? error.message : null,
                    });
                }
            );

            activeReviewsUnsubscribe = unsubscribe;
            return () => {
                reviewSubscribersCount = Math.max(0, reviewSubscribersCount - 1);
                if (reviewSubscribersCount === 0 && activeReviewsUnsubscribe) {
                    activeReviewsUnsubscribe();
                    activeReviewsUnsubscribe = null;
                }
            };
        } catch (error) {
            console.error('Error subscribing to reviews: ', error);
            reviewSubscribersCount = Math.max(0, reviewSubscribersCount - 1);
            set({ isLoading: false });
            return null;
        }
    },

    unsubscribeFromReviews: () => {
        if (activeReviewsUnsubscribe) {
            activeReviewsUnsubscribe();
            activeReviewsUnsubscribe = null;
        }
        reviewSubscribersCount = 0;
    },

    fetchAll: async () => {
        if (Platform.OS !== 'web') {
            const network = await NetInfo.fetch();
            const isOnline = Boolean(network.isConnected && network.isInternetReachable);
            if (!isOnline) {
                set({ isLoading: false });
                return;
            }
        }

        const isCacheEmpty = get().reviews.length === 0;
        if (isCacheEmpty) {
            set({ isLoading: true });
        }
        set({ error: null });

        try {
            const reviews = await ReviewRepo.retrieveAll();
            set({ reviews: reviews ?? [], isLoading: false });
        } catch (err) {
            console.error(err);
            set({
                error: get().reviews.length === 0 ? ((err as Error).message ?? 'Failed to load reviews') : null,
                isLoading: false,
            });
        }
    },

    refresh: async () => {
        if (Platform.OS !== 'web') {
            const network = await NetInfo.fetch();
            const isOnline = Boolean(network.isConnected && network.isInternetReachable);
            if (!isOnline) {
                set({ isLoading: false });
                return;
            }
        }

        set({ isLoading: true, error: null });

        try {
            const reviews = await ReviewRepo.retrieveAll();
            set({ reviews: reviews ?? [], isLoading: false });
        } catch (err) {
            console.error(err);
            set({
                error: get().reviews.length === 0 ? ((err as Error).message ?? 'Failed to load reviews') : null,
                isLoading: false,
            });
        }
    },

    retrieveAll: async (): Promise<Review[]> => {
        set({ isLoading: true, error: null });

        try {
            const reviews = await ReviewRepo.retrieveAll();
            set({ reviews, isLoading: false });
            return reviews;
        } catch (err) {
            console.error(err);
            set({ error: (err as Error).message ?? 'Failed to load reviews', isLoading: false });
            return []
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
            set({
                reviews: upsertItem(get().reviews, newReviewItem).sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                ),
                isLoading: false,
            })
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
