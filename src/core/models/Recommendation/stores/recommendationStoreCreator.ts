import { TEdit } from '@/src/core/interface/domainHookInterface';
import { BaseStore } from '@/src/core/interface/storeInterface';
import { Recommendation } from '@/src/core/models/Recommendation/interfaces/Recommendation.types';
import { RecommendationRepo } from '@/src/core/models/Recommendation/repositories/recommendationRepository';
import { newRecommendation } from '@/src/core/models/Recommendation/utils/RecommendationFactory';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { StateCreator } from 'zustand';

export type RecommendationState = BaseStore<Recommendation>;

const init = {
    recommendations: null,
    error: null,
    isLoading: false,
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

        if (Platform.OS !== 'web') {
            const network = await NetInfo.fetch();
            const isOnline = Boolean(network.isConnected && network.isInternetReachable);
            if (!isOnline) {
                set({ isLoading: false });
                return;
            }
        }

        const isCacheEmpty = get().data.length === 0;
        if (isCacheEmpty) {
            set({ isLoading: true });
        }
        set({ error: null });

        try {
            const recommendations = await RecommendationRepo.fetchAll(uid);
            if (recommendations && recommendations.length > 0) {
                set({
                    data: recommendations,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (err) {
            set({
                error: get().data.length === 0 ? ((err as Error).message ?? `Failed loading recommendations for ${uid}`) : null,
                isLoading: false,
            });
        }
    },

    refresh: async (uid?: string | null) => {
        const id = uid || get().current?.id;
        if (!id) return;
        await get().load(id);
    },

    load: async (id: string, monthId?: string) => {
        if (!id) {
            return;
        }

        if (Platform.OS !== 'web') {
            const network = await NetInfo.fetch();
            const isOnline = Boolean(network.isConnected && network.isInternetReachable);
            if (!isOnline) {
                set({ isLoading: false });
                return;
            }
        }

        const currentData = get().current;
        const hasCachedCurrent = Boolean(
            currentData &&
            currentData.id &&
            ((currentData.easy && currentData.easy.length > 0) ||
                (currentData.trails && currentData.trails.length > 0) ||
                (currentData.difficult && currentData.difficult.length > 0))
        );

        // Only set full loading indicator if there is no cached data to display
        if (!hasCachedCurrent) {
            set({ isLoading: true });
        }
        set({ error: null });

        try {
            const recoList = monthId
                ? await RecommendationRepo.fetchByMonth(id, monthId)
                : await RecommendationRepo.fetchCurrent(id);

            if (recoList) {
                set({
                    current: recoList,
                    isLoading: false,
                });
            } else {
                // If remote returned nothing/null (e.g. offline fallback), retain existing cache
                set({
                    isLoading: false,
                });
            }
        } catch (err) {
            // Keep existing cached data intact on error
            set({
                error: hasCachedCurrent ? null : ((err as Error).message ?? `Failed loading recommendations for ${id}`),
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
