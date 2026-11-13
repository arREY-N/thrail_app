import { BusinessReviewState, businessReviewStoreCreator } from "@/src/core/models/BusinessReview/stores/businessReviewStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useBusinessReviewsStore = create<BusinessReviewState>()(
    persist(
        immer(businessReviewStoreCreator),
        {
            name: 'business-review-store',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                data: state.data,
            })
        }
    )
)