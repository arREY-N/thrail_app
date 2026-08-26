import { ReviewState, reviewStoreCreator } from "@/src/core/models/Review/stores/reviewStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useReviewStore = create<ReviewState>()(
    immer(reviewStoreCreator)
);

export const useReviewsStore = useReviewStore;
