import { useBusinessReviewsStore } from "@/src/core/models/BusinessReview/stores/businessReviewStore";

export function useBusinessReviewState() {
    const isWriting = useBusinessReviewsStore(s => s.isWriting);
    const isLoading = useBusinessReviewsStore(s => s.isLoading);
    const isFetching = useBusinessReviewsStore(s => s.isFetching);
    const error = useBusinessReviewsStore(s => s.error);

    return {
        isWriting,
        isLoading,
        isFetching,
        error
    }
}