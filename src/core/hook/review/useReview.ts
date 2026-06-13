
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Review } from "@/src/core/models/Review/Review";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { useReviewStore } from "@/src/core/stores/reviewStore";
import { router } from "expo-router";
import { useState } from "react";

export interface IReviewDomain {
    reviews: Review[];
    isLoading: boolean;
    error: string | null;

    onWriteReviewPress: (id?: string) => void;
    isOwned: (review: Review) => Boolean;
    likeReview: (review: Review) => void;
    isLiked: (review: Review) => Boolean;
    refreshFeed: () => void;    
    getItemRating: (itemId: string) => number;
}

export type ReviewDomainParams = {
    reviewId?: string;
}

export default function useReview(): IReviewDomain {
    const { profile } = useAuthHook();

    const reviews = useReviewStore(s => s.reviews);
    const like = useReviewStore(s => s.likeReview);
    const isLoading = useReviewStore(s => s.isLoading);
    const error = useReviewStore(s => s.error);
    const refreshFeed = useReviewStore(s => s.refresh);
    const [localError, setLocalError] = useState<string | null>(null);

    const onWriteReviewPress = (id?: string) => {
        if(id){
            router.push({
                pathname: '/(main)/review/write',
                params: { reviewId: id }
                })
        } else {
            router.push({
                pathname: '/(main)/review/write',
            })
        }
    }

    const isOwned = (review: Review): Boolean => {
        return review.user.id === profile?.id
    }

    const likeReview = (review: Review) => {
        try {
            if(!profile)
                throw new Error('User must be logged in to like a review')
            
            let updated = isLiked(review)
                ? review.likes.filter(u => u.id !== profile.id)
                : [...review.likes, UserLogic.toSummary(profile)]
    
            like(new Review({...review, likes: updated}))

        } catch (error) {
            console.error(error);
            setLocalError((error as Error).message)
        }
    }

    const isLiked = (review: Review): Boolean => {
        try {
            if(!profile) return false
                

            return review.likes.some(r => r.id === profile?.id);
        } catch (error) {
            console.error(error);
            setLocalError((error as Error).message)
            return false;
        }
    }

    const getItemRating = (itemId: string): number => {
        const itemReviews = reviews.filter(r => r.trail.id === itemId);
        if(itemReviews.length === 0) return 0;
        const totalRating = itemReviews.reduce((sum, review) => sum + review.overallRating, 0);
        return totalRating / itemReviews.length;
    }

    return {
        onWriteReviewPress,
        isOwned,
        likeReview,
        isLiked,
        refreshFeed,
        getItemRating,
        reviews,
        isLoading,
        error: error || localError, 
    }
}