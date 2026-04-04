import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { TEdit } from "@/src/core/interface/domainHookInterface";
import { ReviewLogic } from "@/src/core/models/Review/Logic/Review.logic";
import { Review } from "@/src/core/models/Review/Review";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { useReviewStore } from "@/src/core/stores/reviewStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { router } from "expo-router";
import { produce } from "immer";
import { useEffect, useState } from "react";

export interface IReviewWrite {
    review: Review;
    isLoading: boolean;
    error: string | null;
    
    onUpdatePress: (params: TEdit<Review>) => void;
    onSaveReview: () => void;
}

export type UseReviewWriteParams = {
    reviewId?: string;
    trailId?: string;
}

export default function useReviewWrite(params: UseReviewWriteParams): IReviewWrite {
    const { reviewId, trailId } = params;
    const { profile } = useAuthHook();

    const isLoading = useReviewStore(s => s.isLoading);
    const error = useReviewStore(s => s.error);
    const reviews = useReviewStore(s => s.reviews);
    const load = useReviewStore(s => s.load);
    const create = useReviewStore(s => s.create);
    const trails = useTrailsStore(s => s.data);

    const [localError, setLocalError] = useState<string | null>(null);
    
    const [review, setReview] = useState<Review>(() => {
        if(reviewId){
            const found = reviews.find(r => r.id === reviewId);

            if(!found) {
                setLocalError(`No review found for id ${reviewId}`);
                return new Review();
            }

            return found;
        } else {
            const newReview = new Review();

            if(!profile){
                setLocalError('User must be logged in');
                return new Review();
            }

            if(!trailId){
                setLocalError('Trail cannot be empty');
                return new Review();
            }

            const trail = trails.find(t => t.id === trailId);

            if(!trail) {
                setLocalError(`No trail found with id ${trailId}`);
                return new Review();
            }
            
            console.log(ReviewLogic.setReviewObject({
                user: profile,
                trail, 
                review: newReview
            }));

            return ReviewLogic.setReviewObject({
                user: profile,
                trail, 
                review: newReview
            })
        }
    });
    
    useEffect(() => {
        const init = async () => {

            if(!reviewId) return;

            if(review.id === reviewId){
                const data = await load(reviewId)
                if(data){
                    setReview(data);
                } else {
                    setLocalError('Review not found');
                }
            }
        }

        init();
    }, [reviewId, load]);

    const onUpdatePress = (params: TEdit<Review>) => {
        const { section, id, value } = params;

        try {
            setReview(prev => 
                produce(prev, (draft) => {
                    if(section === 'root'){
                        draft[id] = value
                    } else {
                        draft[section][id] = value
                    }
                })
            )
        } catch (error) {
            console.error(error)
            setLocalError((error as Error).message)
        }
    }

    const onSaveReview = async () => {
        try {
            if(!profile) 
                throw new Error('User must be logged in');

            onUpdatePress({
                section: 'root',
                id: 'user',
                value: UserLogic.toSummary(profile)
            })

            console.log('To save:', review);
            await create(review)
            
            router.back();
        } catch (error) {
            setLocalError((error as Error).message)
        }
    }   

    return {
        review, 
        isLoading,
        error: error || localError,
        onUpdatePress,
        onSaveReview,
    }
}   