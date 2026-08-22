import { Hike, useHikeStore } from "@/src/core/models/Hike/Hike";
import { Review, useReviewStore } from "@/src/core/models/Review/Review";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { useEffect, useState } from "react";

export type UseWriteReviewParams = {
    hikeId?: string;
}

export default function useWriteReview(params: UseWriteReviewParams) {
    const { hikeId } = params;
    const profile = useAuthStore(s => s.profile);
    const isLoading = useReviewStore(s => s.isLoading);
    const hikes = useHikeStore(s => s.hikes);

    const [review, setReview] = useState<Review | null>(null);
    const [hike, setHike] = useState<Hike | null>(null);

    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (!hikeId)
                throw new Error('Hike ID is required to write a review');

            if (!profile)
                throw new Error('User must be logged in to write a review');

            const found = hikes.find(h => h.id === hikeId);
            if (!found) {
                throw new Error('Hike not found');
            }
            if (found.status !== 'completed')
                throw new Error('Cannot write a review for an incomplete hike');

            setHike(found);
        } catch (error) {
            setLocalError((error as Error).message || 'An error occurred while loading the review');
        }
    }, [hikeId])

}