import { ReviewState, reviewStoreCreator } from "@/src/core/models/Review/stores/reviewStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useReviewStore = create<ReviewState>()(
    persist(
        immer(reviewStoreCreator),
        {
            name: "review-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export const useReviewsStore = useReviewStore;
