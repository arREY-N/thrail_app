import { useReviewList } from "@/src/core/models/Review/Review";
import { newTrail, useTrailList, useTrailStore } from "@/src/core/models/Trail/Trail";
import { catchError } from "@/src/core/utility/errorFormatter";

export function RecalculateTrailRating() {
    const { trails } = useTrailList();
    const { retrieveAll } = useReviewList();
    const create = useTrailStore(s => s.create);

    const calculateTrailRating = async (trailId: string) => {
        const trail = trails.find(t => t.id === trailId);

        if (!trail) {
            return;
        }

        const reviews = await retrieveAll();

        const trailReviews = reviews.filter(r => r.trail.id === trailId);

        let averageRating = 0;
        if (trailReviews.length > 0) {
            const totalRating = trailReviews.reduce((sum, review) => sum + review.overallRating, 0);
            averageRating = totalRating / trailReviews.length;
        }

        const reviewed = newTrail({
            ...trail,
            general: {
                ...trail.general,
                rating: averageRating,
                reviewCount: trailReviews.length
            }
        });

        await create(reviewed);
    }

    const updateTrailRating = async (trailId: string, rating: number) => {
        try {
            if (trailId === 'diy' || trailId === 'DIY') return;

            const trail = trails.find(t => t.id === trailId);

            if (!trail) throw new Error('Trail not found');

            const currentReviews = trail.general.reviewCount;
            const oldRating = trail.general.rating;

            const newAverage = ((currentReviews * oldRating) + rating) / (currentReviews + 1);

            await create({
                ...trail,
                general: {
                    ...trail.general,
                    rating: newAverage,
                    reviewCount: currentReviews + 1
                }
            });
        } catch (error) {
            catchError((error as Error));
        }
    }


    const getItemRating = (trailId: string) => {
        return trails.find(t => t.id === trailId)?.general.rating || 0;
    }

    return {
        updateTrailRating,
        getItemRating,
        calculateTrailRating,
    }
}   