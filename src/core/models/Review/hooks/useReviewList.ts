import { useReviewStore } from "@/src/core/models/Review/stores/reviewStore";
import { useEffect } from "react";

export function useReviewList() {
    const reviews = useReviewStore(s => s.reviews);
    const reviewIsLoading = useReviewStore(s => s.isLoading);
    const reviewError = useReviewStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            await useReviewStore.getState().fetchAll();
        };

        fetch();
    }, []);

    const refresh = async () => {
        await useReviewStore.getState().fetchAll();
    };

    return {
        reviews,
        reviewIsLoading,
        reviewError,
        refresh,
    };
}