import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Review } from "@/src/core/models/Review/interfaces/Review.types";
import { useReviewStore } from "@/src/core/models/Review/stores/reviewStore";
import { newReview } from "@/src/core/models/Review/utils/ReviewFactory";
import { UserLogic } from "@/src/core/models/User/User";
import { router } from "expo-router";
import { useState } from "react";

export type ReviewDomainParams = {
    reviewId?: string;
};

export function useReview() {
    const { profile } = useAuthHook();

    const reviews = useReviewStore(s => s.reviews);
    const like = useReviewStore(s => s.likeReview);
    const [localError, setLocalError] = useState<string | null>(null);

    const onWriteReviewPress = (id?: string) => {
        if (id) {
            router.push({
                pathname: '/(main)/review/write',
                params: { reviewId: id },
            });
        } else {
            router.push({
                pathname: '/(main)/review/write',
            });
        }
    };

    const isOwned = (review: Review): boolean => {
        return review.user.id === profile?.id;
    };

    const likeReview = async (review: Review) => {
        try {
            if (!profile) {
                throw new Error('User must be logged in to like a review');
            }

            const updated = isLiked(review)
                ? review.likes.filter(u => u.id !== profile.id)
                : [...review.likes, UserLogic.toSummary(profile)];

            await like(newReview({ ...review, likes: updated }));
        } catch (error) {
            console.error(error);
            setLocalError((error as Error).message);
        }
    };

    const isLiked = (review: Review): boolean => {
        try {
            if (!profile) return false;
            return review.likes.some(r => r.id === profile?.id);
        } catch (error) {
            console.error(error);
            setLocalError((error as Error).message);
            return false;
        }
    };

    const getItemRating = (itemId: string): number => {
        const itemReviews = reviews.filter(r => r.trail.id === itemId);
        if (itemReviews.length === 0) return 0;
        const totalRating = itemReviews.reduce((sum, review) => sum + review.overallRating, 0);
        return totalRating / itemReviews.length;
    };

    return {
        onWriteReviewPress,
        likeReview,
        isLiked,
        getItemRating,
        isOwned,
        localError,
    };
}