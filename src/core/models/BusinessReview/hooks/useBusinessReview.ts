import { BusinessReview } from "@/src/core/models/BusinessReview/interfaces/BusinessReview";
import { useBusinessReviewsStore } from "@/src/core/models/BusinessReview/stores/businessReviewStore";
import { useAuthHook, UserLogic } from "@/src/core/models/User/User";
import { useCallback, useState } from "react";

export function useBusinessReview() {
    const { profile } = useAuthHook();
    const userId = profile?.id;
    const like = useBusinessReviewsStore(s => s.likeBusinessReview);
    const isLoading = useBusinessReviewsStore(s => s.isLoading);
    const error = useBusinessReviewsStore(s => s.error);

    const [localError, setLocalError] = useState<string | null>(null);

    const isOwned = useCallback((review: BusinessReview): boolean => {
        return review.user.id === userId;
    }, [userId]);

    const isLiked = useCallback((review: BusinessReview): boolean => {
        if (!userId || !Array.isArray(review.likes)) return false;
        return review.likes.some(r => r.id === userId);
    }, [userId]);

    const likeBusinessReview = useCallback(async (review: BusinessReview) => {
        try {
            if (!profile)
                throw new Error('User must be logged in to like a review');

            const summary = UserLogic.toSummary(profile);
            const sanitizedSummary = {
                id: summary.id ?? '',
                username: summary.username ?? '',
                firstname: summary.firstname ?? '',
                lastname: summary.lastname ?? '',
                email: summary.email ?? '',
            };

            const currentLikes = Array.isArray(review.likes) ? review.likes : [];
            const alreadyLiked = currentLikes.some(u => u.id === profile.id);
            const updated = alreadyLiked
                ? currentLikes.filter(u => u.id !== profile.id)
                : [...currentLikes, sanitizedSummary];

            setLocalError(null);
            await like({ ...review, likes: updated });
        } catch (err) {
            console.error(err);
            setLocalError((err as Error).message);
        }
    }, [like, profile]);

    return {
        isOwned,
        isLiked,
        likeBusinessReview,
        isLoading,
        error: error?.message || localError,
    };
}
