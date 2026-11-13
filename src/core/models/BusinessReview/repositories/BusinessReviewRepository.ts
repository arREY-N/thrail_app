import { db } from "@/src/core/config/Firebase";
import { businessReviewConverter } from "@/src/core/models/BusinessReview/factory/BusinessReviewFactory";
import { BusinessReview } from "@/src/core/models/BusinessReview/interfaces/BusinessReview";
import { collection, collectionGroup, deleteDoc, doc, Firestore, getDoc, getDocs, setDoc } from "firebase/firestore";

const createBusinessReviewCollection = (db: Firestore, businessId: string) => {
    return collection(db, 'businesses', businessId, 'reviews').withConverter(businessReviewConverter);
}

export const BusinessReviewRepository = (db: Firestore) => ({
    async fetchAll(): Promise<BusinessReview[]> {
        try {
            const businessReviewCollection = collectionGroup(db, 'reviews').withConverter(businessReviewConverter);
            const snapshot = await getDocs(businessReviewCollection);

            if (snapshot.empty) return [];

            return snapshot.docs
                .filter(docsnap => docsnap.ref.parent.parent?.parent.id === 'businesses')
                .map(docsnap => docsnap.data());
        } catch (error) {
            throw new Error('Error fetching business reviews');
        }
    },

    async fetchById(businessId: string, reviewId: string): Promise<BusinessReview | null> {
        try {
            if (!businessId || !reviewId) return null;
            const businessReviewCollection = createBusinessReviewCollection(db, businessId);
            const docRef = doc(businessReviewCollection, reviewId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            return snap.data();
        } catch (error) {
            throw new Error('Error fetching business review by id');
        }
    },

    async fetchAllBusinessReviews(businessId: string): Promise<BusinessReview[]> {
        try {
            const businessReviewCollection = createBusinessReviewCollection(db, businessId);
            const snapshot = await getDocs(businessReviewCollection);

            if (snapshot.empty) return [];

            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (error) {
            throw new Error('Error fetching business reviews')
        }
    },

    async write(data: BusinessReview): Promise<BusinessReview> {
        try {
            const businessReviewCollection = createBusinessReviewCollection(db, data.business.id);
            const targetId = data.id || data.hikeReview?.id || '';

            const docRef = targetId
                ? doc(businessReviewCollection, targetId)
                : doc(businessReviewCollection);

            const updated: BusinessReview = {
                ...data,
                id: docRef.id,
                updatedAt: new Date(),
            }

            await setDoc(docRef, updated, { merge: true })
            return updated;
        } catch (error) {
            throw new Error('Error writing business review')
        }
    },

    async delete(businessId: string, id: string): Promise<void> {
        try {
            const businessReviewCollection = createBusinessReviewCollection(db, businessId);
            const docRef = doc(businessReviewCollection, id);

            await deleteDoc(docRef);
        } catch (error) {
            throw new Error('Error deleting business review');
        }
    },
})

export const BusinessReviewRepo = BusinessReviewRepository(db);