import { Recommendation } from '@/src/core/models/Recommendation/interfaces/Recommendation.types';
import { recommendationConverter } from '@/src/core/models/Recommendation/utils/RecommendationFactory';
import getRecoID from '@/src/core/utility/recommendation';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

const createRecommendationsCollection = (db: any, uid: string) => {
    return collection(db, 'users', uid, 'recommendations').withConverter(recommendationConverter);
};

export const RecommendationRepository = (db: any) => ({
    /**
     * Fetches all recommendation documents for a user.
     * @param uid The user ID.
     */
    async fetchAll(uid: string): Promise<Recommendation[]> {
        try {
            if (!uid) throw new Error('UID or Recommendation ID missing.');
            const ref = createRecommendationsCollection(db, uid);
            const snapshot = await getDocs(ref);

            if (snapshot.empty) return [];

            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while fetching user recommendations.');
        }
    },

    /**
     * Fetches the current month recommendation document for a user.
     * @param uid The user ID.
     */
    async fetchCurrent(uid: string): Promise<Recommendation | null> {
        try {
            if (!uid) throw new Error('UID or Recommendation ID missing.');

            const recoID = getRecoID();

            const ref = doc(createRecommendationsCollection(db, uid), recoID);
            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                console.log('Current recommendation is not yet ready');
                return null;
            }

            return snapshot.data();
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while fetching current user recommendations.');
        }
    },
});