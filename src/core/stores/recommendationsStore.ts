import { BaseStore } from '@/src/core/interface/storeInterface';
import { Recommendation } from '@/src/core/models/Recommendation/Recommendation';
import { RecommendationRepository } from '@/src/core/repositories/recommendationRepository';
import { Property } from '@/src/core/types/Property';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface RecommendationState extends BaseStore<Recommendation> {

}

const init = {
    recommendations: null,
    error: null,
    isLoading: true,
    data: [],
    current: new Recommendation(),
}

export const useRecommendationsStore = create<RecommendationState>()(immer((set, get) => ({
    ...init,

    reset: () => set(init),

    fetchAll: async () => {

    },

    refresh: async () => {

    },

    load: async (id: string) => {
        set({isLoading: true, error: null});

        try{
            const recoList = await RecommendationRepository.fetchCurrent(id);
            
            if(!recoList){
                set({ 
                    data: [],
                    isLoading: false 
                })
                return;
            }
            
            set({
                current: recoList,
                isLoading: false,
            })
        } catch (err) {
            set({
                error: (err as Error).message ?? `Failed loadig recommendations for ${id}`,
                isLoading: false,
            })
        }
    },

    create: async (): Promise<Boolean> => {
        return true;
    },

    delete: async (id: string) => {

    },

    edit: (property: Property) => {

    }
})))