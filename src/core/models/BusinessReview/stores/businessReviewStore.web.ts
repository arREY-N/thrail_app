import { BusinessReviewState, businessReviewStoreCreator } from "@/src/core/models/BusinessReview/stores/businessReviewStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useBusinessReviewsStore = create<BusinessReviewState>()(
    immer(businessReviewStoreCreator)
)