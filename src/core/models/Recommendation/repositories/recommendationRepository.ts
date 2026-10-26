import { db } from '@/src/core/config/Firebase';
import { IAITrailReasoning, Recommendation } from '@/src/core/models/Recommendation/interfaces/Recommendation.types';
import { SAMPLE_CHALLENGE_RECOMMENDATION } from '@/src/core/models/Recommendation/mocks/sampleRecommendation';
import { recommendationConverter } from '@/src/core/models/Recommendation/utils/RecommendationFactory';
import getRecoID from '@/src/core/utility/recommendation';
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

/**
 * Temporary UI Testing Flag:
 * Feeds the sample Challenge of the Month recommendation document to the current user
 * (with empty easy list and Mt. Daraitan as the nearest challenge) to test the UI flow.
 * Set to false to resume reading from Firestore.
 */
export const USE_SAMPLE_CHALLENGE_MOCK = false;

const createRecommendationsCollection = (db: any, uid: string) => {
    return collection(db, 'users', uid, 'recommendations').withConverter(recommendationConverter);
};

export const RecommendationRepository = (db: any) => ({
    /**
     * Fetches all recommendation documents for a user.
     * @param uid The user ID.
     */
    async fetchAll(uid: string): Promise<Recommendation[]> {
        if (USE_SAMPLE_CHALLENGE_MOCK) {
            return [SAMPLE_CHALLENGE_RECOMMENDATION];
        }

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
     * If the exact current month (YYYY-MM) document is not found, seamlessly
     * falls back to the user's most recent recommendation document in Firestore.
     * @param uid The user ID.
     */
    async fetchCurrent(uid: string): Promise<Recommendation | null> {
        if (USE_SAMPLE_CHALLENGE_MOCK) {
            return SAMPLE_CHALLENGE_RECOMMENDATION;
        }

        if (!uid) return null;
        const recoID = getRecoID();

        // 1. Try exact current month code first
        try {
            const currentMonthReco = await this.fetchByMonth(uid, recoID);
            if (
                currentMonthReco &&
                ((currentMonthReco.easy && currentMonthReco.easy.length > 0) ||
                    (currentMonthReco.trails && currentMonthReco.trails.length > 0) ||
                    (currentMonthReco.difficult && currentMonthReco.difficult.length > 0))
            ) {
                return currentMonthReco;
            }
        } catch (err) {
            console.warn(`[RecommendationRepo] No active doc for current month ${recoID}:`, err);
        }

        // 2. Fallback: Query all documents in /users/{uid}/recommendations
        try {
            const all = await this.fetchAll(uid);
            if (all && all.length > 0) {
                // Filter for any documents that contain trail recommendations
                const withRecos = all.filter(
                    (r) =>
                        (r.easy && r.easy.length > 0) ||
                        (r.trails && r.trails.length > 0) ||
                        (r.difficult && r.difficult.length > 0)
                );

                if (withRecos.length > 0) {
                    // Sort descending by month ID string (e.g., '2026-10', '2026-09') or updatedAt
                    withRecos.sort((a, b) => {
                        if (a.id && b.id) return b.id.localeCompare(a.id);
                        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                        return tB - tA;
                    });
                    return withRecos[0];
                }

                return all[0];
            }
        } catch (allErr) {
            console.warn('[RecommendationRepo] Failed fallback fetchAll recommendations:', allErr);
        }

        return null;
    },

    /**
     * Fetches a recommendation document for a specific month (YYYY-MM).
     * @param uid The user ID.
     * @param monthId Month string in YYYY-MM format.
     */
    async fetchByMonth(uid: string, monthId: string): Promise<Recommendation | null> {
        if (USE_SAMPLE_CHALLENGE_MOCK) {
            return SAMPLE_CHALLENGE_RECOMMENDATION;
        }

        try {
            if (!uid || !monthId) throw new Error('UID or Month ID missing.');

            const ref = doc(createRecommendationsCollection(db, uid), monthId);
            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) {
                console.log(`Recommendation for ${monthId} is not yet available.`);
                return null;
            }

            return snapshot.data();
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error(`An error occurred while fetching user recommendations for ${monthId}.`);
        }
    },

    /**
     * Saves or merges AI-generated reasoning for a specific trail within a monthly recommendation doc.
     * @param uid The user ID.
     * @param monthId Month string in YYYY-MM format.
     * @param trailId The trail ID.
     * @param reasoning The structured IAITrailReasoning object.
     */
    async saveAiReasoning(uid: string, monthId: string, trailId: string, reasoning: IAITrailReasoning): Promise<void> {
        try {
            if (!uid || !monthId || !trailId) return;
            const ref = doc(db, 'users', uid, 'recommendations', monthId);
            await setDoc(ref, {
                aiReasonings: {
                    [trailId]: reasoning,
                },
            }, { merge: true });
        } catch (err) {
            console.error('Failed to cache AI reasoning in Firestore:', err);
        }
    },
});

export const RecommendationRepo = RecommendationRepository(db);
