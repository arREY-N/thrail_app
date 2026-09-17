import { Review } from "@/src/core/models/Review/interfaces/Review.types";
import { useReviewStore } from "@/src/core/models/Review/stores/reviewStore";
import { useEffect, useState } from "react";

export function useReviewItem(id?: string) {
    const reviews = useReviewStore(s => s.reviews);
    const isLoading = useReviewStore(s => s.isLoading);
    const error = useReviewStore(s => s.error);
    const [review, setReview] = useState<Review | null>(null);

    useEffect(() => {
        if (!id) return;

        const found = reviews.find(r => r.id === id);
        if (found) {
            setReview(found);
            return;
        }

        const fetch = async () => {
            const item = await useReviewStore.getState().load(id);
            if (item) setReview(item);
        };

        fetch();
    }, [id, reviews]);

    return {
        review,
        isLoading,
        error,
    };
}
