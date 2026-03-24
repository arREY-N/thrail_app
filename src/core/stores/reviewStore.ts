import { Review } from "@/src/core/models/Review/Review";
import { ReviewRepository } from "@/src/core/repositories/ReviewRepository.1";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface ReviewState {
    reviews: Review[];
    isLoading: boolean;
    error: string | null;
}

export const useReviewStore = create<ReviewState>()(immer((set, get) => ({
    reviews: [],
    isLoading: false,
    error: null,

    fetchAll: async () => {
        set({isLoading: true, error: null});

        try {
            if(get().reviews.length > 0) return;

            const reviews = await ReviewRepository.fetchAll(true);
            set({reviews, isLoading: false});
        } catch (err) {
            console.error(err);
            set({error: (err as Error).message ?? 'Failed to load reviews', isLoading: false});
        }
    },

    refresh: async () => {
        set({isLoading: true, error: null});

        try {
            const reviews = await ReviewRepository.fetchAll();
            set({reviews, isLoading: false});
        } catch (err) {
            console.error(err);
            set({error: (err as Error).message ?? 'Failed to load reviews', isLoading: false});
        }
    },

    fetchByUserId: async (userId: string) => {
        set({isLoading: true, error: null});
        
        try {
            const reviews = await ReviewRepository.fetchByUserId(userId, true);
            set({reviews, isLoading: false});
        } catch (err) {
            console.error(err);
            set({error: (err as Error).message ?? 'Failed to load reviews', isLoading: false});
        }
    },

    create: async (review: Review) => {
        set({isLoading: true, error: null});
        try {
            const newReview = await ReviewRepository.write(review);
            set((state) => {
                const updated = review.id 
                    ? state.reviews.map((r) => r.id === review.id ? newReview : r)
                    : [newReview, ...state.reviews];
                
                return {
                    reviews: updated.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), 
                    isLoading: false
                };
            });
        } catch (err) {
            console.error(err);
            set({error: (err as Error).message ?? 'Failed to create review', isLoading: false});
        }
    },
    
    remove: async (id: string) => {
        set({isLoading: true, error: null}); 
        
        try {
            await ReviewRepository.delete(id);

            set({
                isLoading: false, 
                reviews: get().reviews.filter(r => r.id !== id)
            });
        } catch (err) {
            console.error(err);
            set({error: (err as Error).message ?? 'Failed to delete review', isLoading: false});
        }
    }
})))