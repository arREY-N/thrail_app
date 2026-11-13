import { useBusinessReviewState } from "@/src/core/models/BusinessReview/hooks/useBusinessReviewState";
import { useBusinessReviewsStore } from "@/src/core/models/BusinessReview/stores/businessReviewStore.native";
import { useEffect } from "react";

export function useBusinessReviewList(businessId?: string) {
    const { isFetching } = useBusinessReviewState();
    const data = useBusinessReviewsStore(s => s.data);
    const reviewsByBusiness = useBusinessReviewsStore(s => s.data).filter(s => s.business.id === businessId)

    useEffect(() => {
        const fetch = async () => {
            if (businessId) {
                await useBusinessReviewsStore.getState().fetchByBusiness(businessId)
            } else {
                await useBusinessReviewsStore.getState().fetchAll();
            }
        }

        fetch();
    }, [businessId]);

    const refresh = async () => {
        await useBusinessReviewsStore.getState().refresh()
    }

    return {
        refresh,
        isFetching,
        data: businessId ? reviewsByBusiness : data,
    }
}