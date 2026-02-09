import { fetchCurrentRecommendation } from '@/src/core/repositories/recommendationRepository';
import { create } from 'zustand';

const init = {
    recommendations: null,
    error: null,
    isLoading: true,
}

export const useRecommendationsStore = create((set, get) => ({
    ...init,

    reset: () => set(init),

    loadRecommendations: async (userId) => {
        set({isLoading: true, error: null});

        try{
            const recoList = await fetchCurrentRecommendation(userId);
            
            if(!recoList){
                set({ 
                    recommendations: [],
                    isLoading: false 
                })
                return;
            }
            
            set({
                recommendations: recoList,
                isLoading: false,
            })
        } catch (err) {
            set({
                error: err.message ?? `Failed loadig recommendations for ${userId}`,
                isLoading: false,
            })
        }
    }
}))