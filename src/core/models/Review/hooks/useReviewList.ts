import { useReviewStore } from "@/src/core/stores/reviewStore";
import { useEffect } from "react";

export function useReviewList() {
    const reviews = useReviewStore(s => s.reviews);
    const isLoading = useReviewStore(s => s.isLoading);

    useEffect(() => {
        const fetch = async () => {
            await useReviewStore.getState().fetchAll();
        }

        fetch();
    }, [])

    const refresh = async () => {
        await useReviewStore.getState().fetchAll();
    }

    return {
        reviews,
        isLoading,
        refresh
    }
}