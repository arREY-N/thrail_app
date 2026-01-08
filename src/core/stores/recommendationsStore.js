import { fetchUserRecommendations } from '@/src/core/repositories/recommendationRepository';
import { create } from 'zustand';

const init = {
    recommendations: [],
    error: null,
    isLoading: true,
}

export const useRecommendationsStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    loadRecommendations: async (userId) => {
        set({isLoading: true, error: null});

        try{
            const recommendations = await fetchUserRecommendations(userId);

            set({
                isLoading: false,
                recommendations
            })
        } catch (err) {
            set({
                error: err.message ?? `Failed loadig recommendations for ${userId}`,
                isLoading: false,
            })
        }
    }
}))