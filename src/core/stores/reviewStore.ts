import { Review } from "@/src/core/models/Review/Review";
import { ReviewRepository } from "@/src/core/repositories/reviewRepository";
import { Unsubscribe } from "firebase/auth";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface ReviewState {
    reviews: Review[];
    isLoading: boolean;
    error: string | null;
    
    subscribeToReviews: () => Promise<Unsubscribe | null>;

    fetchAll: () => Promise<void>;
    refresh: () => Promise<void>;
    fetchByUserId: (userId: string) => Promise<void>;
    load: (id: string) => Promise<Review | null>;
    create: (review: Review) => Promise<void>;
    remove: (id: string) => Promise<void>;
    likeReview: (review: Review) => void;
}

export const useReviewStore = create<ReviewState>()(immer((set, get) => ({
    reviews: [],
    isLoading: false,
    error: null,
    unsubscribe: null,

    subscribeToReviews: async () => {
        try {
            const unsubscribe = ReviewRepository.listenToReviews(
                (reviews) => set({
                    reviews: reviews
                })
            )

            return unsubscribe;
        } catch (error) {
            console.error('Error subscribing to reviews: ', error)
            throw error;
        }
    },

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

    load: async (id: string): Promise<Review | null> => {
        set({isLoading: true, error: null}); 

        try {
            let review = null;

            if(get().reviews.some(r => r.id === id)) {
                review = get().reviews.find(r => r.id === id) || null;

                if(review) {
                    set({isLoading: false});
                    return review;
                }
            }

            if(!review) {
                review = await ReviewRepository.fetchById(id);
            }

            if(!review) {
                set({error: 'Review not found', isLoading: false});
                return null;
            }

            set({
                reviews: [...get().reviews.filter(r => r.id !== id), review], 
                isLoading: false
            });
            
            return review;
        } catch (err) {
            console.error(err);
            set({error: (err as Error).message ?? 'Failed to load review', isLoading: false});
            return null;
        }
    },

    likeReview: async (review: Review): Promise<void> => {
        const response: Review = await ReviewRepository.write(review);
        set((state) => {
            const index = state.reviews.findIndex(r => r.id === review.id);
            if(index !== -1){
                state.reviews[index] = response;
            }
        })
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
                if(review.id){
                    const index = state.reviews.findIndex(r => r.id === review.id);
                    if(index !== -1) state.reviews[index] = newReview;
                } else {
                    state.reviews.push(newReview);
                }

                state.reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                state.isLoading = false;
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

            set((state) => {   
                const index = state.reviews.findIndex(r => r.id === id);
                
                if(index !== -1) {
                    state.reviews.splice(index, 1);
                }
                
                state.isLoading = false;
            });
        } catch (err) {
            console.error(err);
            set({error: (err as Error).message ?? 'Failed to delete review', isLoading: false});
        }
    }
})))