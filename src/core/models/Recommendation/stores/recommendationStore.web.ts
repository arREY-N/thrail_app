import { RecommendationState, recommendationStoreCreator } from "@/src/core/models/Recommendation/stores/recommendationStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useRecommendationsStore = create<RecommendationState>()(
    immer(recommendationStoreCreator)
);

export const useRecommendationStore = useRecommendationsStore;
