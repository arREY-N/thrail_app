import { Review } from "@/src/core/models/Review/interfaces/Review.types";
import { useReviewStore } from "@/src/core/models/Review/stores/reviewStore";
import { useEffect } from "react";

export function useReviewList() {
    const reviews = useReviewStore(s => s.reviews);
    const reviewIsLoading = useReviewStore(s => s.isLoading);
    const reviewError = useReviewStore(s => s.error);

    useEffect(() => {
        const unsub = useReviewStore.getState().subscribeToReviews();

        return () => unsub?.();
    }, []);

    const refresh = async () => {
        await useReviewStore.getState().refresh();
    };

    const retrieveAll = async (): Promise<Review[]> => {
        const reviews = await useReviewStore.getState().retrieveAll();
        return reviews;
    }


    return {
        reviews,
        reviewIsLoading,
        reviewError,
        retrieveAll,
        refresh,
    };
}