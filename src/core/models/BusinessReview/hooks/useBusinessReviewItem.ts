import { useBusinessReviewState } from "@/src/core/models/BusinessReview/hooks/useBusinessReviewState";
import { useBusinessReviewsStore } from "@/src/core/models/BusinessReview/stores/businessReviewStore";
import { useEffect } from "react";

export function useBusinessReviewItem(reviewId: string) {
    const { isWriting } = useBusinessReviewState();
    const reviewInData = useBusinessReviewsStore(s => s.data).filter(s => s.id === reviewId);

    useEffect(() => {
        const fetch = async () => {
            if (reviewId) {
                await useBusinessReviewsStore.getState().fetchByReviewId(reviewId);
            }
        }

        fetch();
    }, [reviewId])

    return {
        isWriting,
        reviewInData
    }
}