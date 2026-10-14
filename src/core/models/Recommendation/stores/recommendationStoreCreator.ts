import { TEdit } from '@/src/core/interface/domainHookInterface';
import { BaseStore } from '@/src/core/interface/storeInterface';
import { Recommendation } from '@/src/core/models/Recommendation/interfaces/Recommendation.types';
import { RecommendationRepo } from '@/src/core/models/Recommendation/repositories/recommendationRepository';
import { newRecommendation } from '@/src/core/models/Recommendation/utils/RecommendationFactory';
import { StateCreator } from 'zustand';

export type RecommendationState = BaseStore<Recommendation>;

const init = {
    recommendations: null,
    error: null,
    isLoading: true,
    data: [],
    current: newRecommendation(),
};

export const recommendationStoreCreator: StateCreator<
    RecommendationState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    reset: () => set(init),

    fetchAll: async (uid?: string) => {
        if (!uid) return;
        set({ isLoading: true, error: null });
        try {
            const recommendations = await RecommendationRepo.fetchAll(uid);
            set({
                data: recommendations,
                isLoading: false,
            });
        } catch (err) {
            set({
                error: (err as Error).message ?? `Failed loading recommendations for ${uid}`,
                isLoading: false,
            });
        }
    },

    refresh: async () => {

    },

    load: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
            const recoList = await RecommendationRepo.fetchCurrent(id);

            if (!recoList) {
                set({
                    data: [],
                    isLoading: false,
                });
                return;
            }

            set({
                current: recoList,
                isLoading: false,
            });
        } catch (err) {
            set({
                error: (err as Error).message ?? `Failed loading recommendations for ${id}`,
                isLoading: false,
            });
        }
    },

    create: async (): Promise<boolean> => {
        return true;
    },

    delete: async (id: string) => {

    },

    edit: (property: TEdit<Recommendation>) => {

    },
});
