import { Review } from "@/src/core/models/Review/Review";
import { useReviewStore } from "@/src/core/stores/reviewStore";
import { useEffect, useState } from "react";

export interface IReviewDomain {
    reviews: Review[];
    review: Review;
    isLoading: boolean;
    error: string | null;
}

export type ReviewDomainParams = {
    reviewId?: string;
}

export default function useReview(params: ReviewDomainParams): IReviewDomain {
    const { reviewId } = params;

    const reviews = useReviewStore(s => s.reviews);
    const [review, setReview] = useState<Review>(() => {
        return reviews.find(r => r.id === reviewId) || new Review({
            hike: {
                date: new Date(),
                overallRating: 5,
                perceivedDifficulty: 'Just Right',
                predictedDifficulty: 'Just Right',
                trailMaintenance: 'Just Right',
                difficultyFactors: [],
                favoredFactors: [],
                review: 'test review',
                image: [],
                id: 'test mountain',
                name: 'tagapo',
            }
        });
    });

    const isLoading = useReviewStore(s => s.isLoading);
    const error = useReviewStore(s => s.error);
    
    useEffect(() => {
        if(reviewId) {
            const found = reviews.find(r => r.id === reviewId);
            if(found) setReview(found);
        }
    }, [reviewId]);

    return {
        reviews,
        review,
        isLoading,
        error
    }
}