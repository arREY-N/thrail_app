import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { TEdit } from "@/src/core/interface/domainHookInterface";
import { ReviewLogic } from "@/src/core/models/Review/Logic/Review.logic";
import { Review } from "@/src/core/models/Review/Review";
import { UserLogic } from "@/src/core/models/User/logic/User.logic";
import { HikeRepository } from "@/src/core/repositories/hikeRepository";
import { useHikesStore } from "@/src/core/stores/hikeStores/hikesStore";
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
    hikeId?: string;

    distance?: number;
    duration?: number;
    elevation?: number;
}

export default function useReviewWrite(params: UseReviewWriteParams): IReviewWrite {
    const { reviewId, trailId, hikeId, distance, duration, elevation } = params;
    const { profile } = useAuthHook();

    const isLoading = useReviewStore(s => s.isLoading);
    const error = useReviewStore(s => s.error);
    const reviews = useReviewStore(s => s.reviews);
    const load = useReviewStore(s => s.load);
    const create = useReviewStore(s => s.create);
    const trails = useTrailsStore(s => s.data);
    const hikes = useHikesStore(s => s.hikes);

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

            newReview.distance = distance || 0;
            newReview.duration = duration || 0;
            newReview.elevation = elevation || 0;

            return ReviewLogic.setReviewObject({
                user: profile,
                trail, 
                review: newReview
            })
        }
    });
    
    useEffect(() => {
        const init = async () => {
            if(reviewId){
                if(review.id === reviewId){
                    const data = await load(reviewId)
                    if(data) setReview(data);
                    else setLocalError('Review not found');
                }
            } else if (hikeId && profile) {
                const completedHike = hikes.find(h => h.id === hikeId);
                const finalDist = completedHike?.distance || distance || 0;
                const finalDur = completedHike?.duration || duration || 0;
                const finalElev = completedHike?.elevation || elevation || 0;

                if (!completedHike && finalDist === 0) {
                    try {
                        const fetchedHike = await HikeRepository.fetchById(profile.id, hikeId);
                        if (fetchedHike) {
                            setReview(prev => produce(prev, draft => {
                                draft.distance = fetchedHike.distance || 0;
                                draft.duration = fetchedHike.duration || 0;
                                draft.elevation = fetchedHike.elevation || 0;
                                draft.hikeDate = fetchedHike.startTime || new Date();
                            }));
                        }
                    } catch (e) {
                        console.error("Could not auto-fill hike metrics from DB", e);
                    }
                } else if (finalDist > 0 || finalDur > 0 || finalElev > 0) {
                    setReview(prev => produce(prev, draft => {
                        draft.distance = finalDist;
                        draft.duration = finalDur;
                        draft.elevation = finalElev;
                        if (completedHike?.startTime) draft.hikeDate = completedHike.startTime;
                    }));
                }
            }
        }
        init();
    }, [reviewId, hikeId, profile?.id, load, distance, duration, elevation]);

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

            const finalReviewToSave = produce(review, draft => {
                draft.user = UserLogic.toSummary(profile);
            });

            console.log('To save:', finalReviewToSave);
            await create(finalReviewToSave)
            
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