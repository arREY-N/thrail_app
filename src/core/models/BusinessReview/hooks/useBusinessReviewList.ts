import { useBusinessReviewState } from "@/src/core/models/BusinessReview/hooks/useBusinessReviewState";
import { BusinessReview } from "@/src/core/models/BusinessReview/interfaces/BusinessReview";
import { useBusinessReviewsStore } from "@/src/core/models/BusinessReview/stores/businessReviewStore";
import { useCallback, useEffect } from "react";

const EMPTY_REVIEWS: BusinessReview[] = [];

export function useBusinessReviewList(businessId?: string) {
    const { isFetching } = useBusinessReviewState();
    const scopedReviews = useBusinessReviewsStore((s) =>
        businessId ? s.reviewsByBusiness[businessId] : s.data
    );
    const data = scopedReviews ?? EMPTY_REVIEWS;

    useEffect(() => {
        if (businessId) {
            const unsubscribe = useBusinessReviewsStore
                .getState()
                .subscribeToBusinessReviews(businessId);
            return () => unsubscribe();
        }

        useBusinessReviewsStore.getState().fetchAll();
    }, [businessId]);

    const refresh = useCallback(async () => {
        if (businessId) {
            await useBusinessReviewsStore.getState().refreshBusiness(businessId);
        } else {
            await useBusinessReviewsStore.getState().refresh();
        }
    }, [businessId]);

    return {
        refresh,
        isFetching,
        data,
    };
}