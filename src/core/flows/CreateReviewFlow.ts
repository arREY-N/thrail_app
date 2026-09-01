import { HikeRepo, useHikesStore, useHikeStore } from "@/src/core/models/Hike/Hike";
import { getReverseGeocode } from "@/src/core/models/Location/Location";
import { newReview, Review, ReviewLogic, useReviewStore } from "@/src/core/models/Review/Review";
import { ITrailSummary, newTrail, useTrailsStore } from "@/src/core/models/Trail/Trail";
import { useAuthHook, UserLogic } from "@/src/core/models/User/User";
import { router } from "expo-router";
import { produce } from "immer";
import { useEffect, useState } from "react";

export interface IReviewWrite {
    review: Review;
    isLoading: boolean;
    error: string | null;

    onUpdatePress: (payload: { section: string; id: string; value: unknown }) => void;
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

export function CreateReviewFlow(params: UseReviewWriteParams): IReviewWrite {
    const { reviewId, trailId, hikeId, distance, duration, elevation } = params;
    const { profile } = useAuthHook();

    const isLoading = useReviewStore(s => s.isLoading);
    const error = useReviewStore(s => s.error);
    const reviews = useReviewStore(s => s.reviews);
    const load = useReviewStore(s => s.load);
    const create = useReviewStore(s => s.create);
    const trails = useTrailsStore(s => s.data);
    const hikes = useHikeStore(s => s.hikes);
    const coordinates = useHikesStore(s => s.coordinates);
    const elapsedTime = useHikeStore(s => s.elapsedTime);
    const totalDistance = useHikeStore(s => s.totalDistance);
    const totalElevationGain = useHikeStore(s => s.totalElevationGain);

    const [localError, setLocalError] = useState<string | null>(null);

    const [review, setReview] = useState<Review>(() => {
        if (reviewId) {
            const found = reviews.find(r => r.id === reviewId);

            if (!found) {
                setLocalError(`No review found for id ${reviewId}`);
                return newReview();
            }

            return found;
        } else {
            const newReviewItem = newReview();

            if (!profile) {
                setLocalError('User must be logged in');
                return newReview();
            }

            if (!trailId) {
                setLocalError('Trail cannot be empty');
                return newReview();
            }

            const trail = trailId === 'diy' || trailId === 'diy_session' ? newTrail() : trails.find(t => t.id === trailId);

            if (!trail) {
                setLocalError(`No trail found with id ${trailId}`);
                return newReview();
            }

            newReviewItem.distance = totalDistance || 0;
            newReviewItem.duration = elapsedTime || 0;
            newReviewItem.elevation = totalElevationGain || 0;

            return ReviewLogic.setReviewObject({
                user: profile,
                trail,
                review: newReviewItem
            })
        }
    });

    useEffect(() => {
        const init = async () => {
            if (reviewId) {
                if (review.id === reviewId) {
                    const data = await load(reviewId)
                    if (data) setReview(data);
                    else setLocalError('Review not found');
                }
            } else if (hikeId && profile) {
                const completedHike = hikes.find(h => h.id === hikeId);
                const finalDist = completedHike?.distance || distance || 0;
                const finalDur = completedHike?.duration || duration || 0;
                const finalElev = completedHike?.elevation || elevation || 0;

                if (!completedHike && finalDist === 0) {
                    try {
                        const fetchedHike = await HikeRepo.fetchById(profile.id, hikeId);
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
    }, [reviewId, hikeId, profile?.id, load, distance, duration, elevation, profile, review.id, hikes]);

    const onUpdatePress = (payload: { section: string; id: string; value: unknown }) => {
        try {
            const { section, id, value } = payload;
            setReview(prev =>
                produce(prev, (draft) => {
                    if (section === 'root') {
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
            if (!profile)
                throw new Error('User must be logged in');

            const isNew = review.id === '';

            let location: ITrailSummary = review.trail;

            if (isNew && (review.trail.id === 'diy' || review.trail.id === 'diy_session' || review.trail.id === '')) {
                const coor = coordinates[0];

                if (!coor.latitude || !coor.longitude) {
                    return;
                };

                const locationName = await getReverseGeocode(coor.latitude, coor.longitude);

                location = {
                    id: review.trail.id,
                    location: locationName?.location || 'Location Unknown',
                    name: locationName?.name || 'Location Unknown',
                }
            }

            const finalReviewToSave = produce(review, draft => {
                draft.user = UserLogic.toSummary(profile);
                draft.trail = location
            });

            await create(finalReviewToSave)

            router.replace('/');
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