import { Hike } from "@/src/core/models/Hike/Hike";
import { Review } from "@/src/core/models/Review/Review";
import { Trail, useTrailStore } from "@/src/core/models/Trail/Trail";
import { User, useUserStore } from "@/src/core/models/User/User";
import {
    useRecommendationHikeStore,
    useRecommendationReviewStore,
} from "@/src/recommendation/store/recommendationStore";

export interface DataSet {
    trails: Trail[];
    users: User[];
    hikes: Hike[];
    reviews: Review[];
    hikesByUser?: Record<string, Hike[]>;
    reviewsByUser?: Record<string, Review[]>;
    reviewsByTrail?: Record<string, Review[]>;
}

/**
 * Pure data preparation logic for the recommendation engine.
 * Leverages the existing persistent Zustand stores (AsyncStorage).
 * Queries Firestore only when the local cache is empty or when forceRefresh is requested.
 */
export const dataPreparation = async (forceRefresh = false): Promise<DataSet> => {
    try {
        const trailStore = useTrailStore.getState();
        const userStore = useUserStore.getState();
        const hikeStore = useRecommendationHikeStore.getState();
        const reviewStore = useRecommendationReviewStore.getState();

        if (forceRefresh) {
            await Promise.all([
                trailStore.refresh(),
                userStore.refresh(),
                reviewStore.refresh(),
            ]);
            await hikeStore.refresh(useUserStore.getState().data);
        } else {
            const promises: Promise<unknown>[] = [];
            if (trailStore.data.length === 0) {
                promises.push(trailStore.fetchAll());
            }
            if (userStore.data.length === 0) {
                promises.push(userStore.fetchAll());
            }
            if (reviewStore.data.length === 0) {
                promises.push(reviewStore.fetchAll());
            }
            if (promises.length > 0) {
                await Promise.all(promises);
            }

            if (hikeStore.data.length === 0) {
                await hikeStore.fetchAll(useUserStore.getState().data);
            }
        }

        const trails = useTrailStore.getState().data;
        const users = useUserStore.getState().data;
        const hikes = useRecommendationHikeStore.getState().data;
        const reviews = useRecommendationReviewStore.getState().data;

        // Group hikes by user for quick lookup in recommendation algorithms
        const hikesByUser: Record<string, Hike[]> = {};
        for (const hike of hikes) {
            const userId = hike.user?.id;
            if (userId) {
                if (!hikesByUser[userId]) hikesByUser[userId] = [];
                hikesByUser[userId].push(hike);
            }
        }

        // Group reviews by user and by trail
        const reviewsByUser: Record<string, Review[]> = {};
        const reviewsByTrail: Record<string, Review[]> = {};
        for (const review of reviews) {
            const userId = review.user?.id;
            if (userId) {
                if (!reviewsByUser[userId]) reviewsByUser[userId] = [];
                reviewsByUser[userId].push(review);
            }
            const trailId = review.trail?.id;
            if (trailId) {
                if (!reviewsByTrail[trailId]) reviewsByTrail[trailId] = [];
                reviewsByTrail[trailId].push(review);
            }
        }

        return {
            trails,
            users,
            hikes,
            reviews,
            hikesByUser,
            reviewsByUser,
            reviewsByTrail,
        };
    } catch (err) {
        console.error("Error during recommendation dataPreparation:", err);
        throw err;
    }
};
