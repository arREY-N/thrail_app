import { RecommendationState, recommendationStoreCreator } from "@/src/core/models/Recommendation/stores/recommendationStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useRecommendationsStore = create<RecommendationState>()(
    persist(
        immer(recommendationStoreCreator),
        {
            name: "recommendation-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export const useRecommendationStore = useRecommendationsStore;
