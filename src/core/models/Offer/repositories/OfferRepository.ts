import { db, functions } from "@/src/core/config/Firebase";
import { httpsCallable } from "firebase/functions";
import { Offer, OfferParams } from "@/src/core/models/Offer/interfaces/Offer.types";
import { newOffer, offerConverter } from "@/src/core/models/Offer/utils/OfferFactory";
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, or, query, setDoc, where } from 'firebase/firestore';

const createOffersCollection = (db: any, businessId: string) => {
    return collection(db, 'businesses', businessId, 'offers').withConverter(offerConverter);
}

const createOffersGroupCollection = (db: any) => {
    return collectionGroup(db, 'offers').withConverter(offerConverter);
}

export const OfferRepository = (db: any) => ({
    /**
     * Fetches all offers from the database.
     * @returns 
     */
    async fetchAll(): Promise<Offer[]> {
        try {
            const offerCollection = createOffersGroupCollection(db);
            const snapshot = await getDocs(offerCollection);

            if (snapshot.empty) return [];

            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed to fetch offer')
        }
    },

    /**
     * Fetches all offers associated with a specific business.
     * @param businessId The ID of the business for which to fetch offers. 
     * @returns 
     */
    async fetchAllBusinessOffers(businessId: string): Promise<Offer[] | []> {
        try {
            const offerCollection = createOffersCollection(db, businessId);
            const snapshot = await getDocs(offerCollection);

            if (snapshot.empty) return [];

            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching business offers')
        }
    },

    /**
     * Fetches all offers associated with a specific trail.
     * @param trailId The ID of the trail for which to fetch offers.
     * @returns 
     */
    async fetchAllTrailOffers(trailId: string): Promise<Offer[] | []> {
        try {
            if (!trailId) throw new Error('Trail ID missing');

            const ref = collectionGroup(db, 'offers');
            const q = query(ref, where('trail.id', '==', trailId));

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) return [];

            return querySnapshot.docs.map(docsnap => docsnap.data() as Offer);
        } catch (err: any) {
            throw new Error(err.message || 'Failed fetching offer for')
        }
    },

    /**
     * Fetches an offer by its ID and business ID.
     * @param OfferParams An object containing the offer ID and business ID.
     * @returns 
     */
    async fetchById({ id, businessId }: OfferParams): Promise<Offer | null> {
        try {
            const offerCollection = createOffersCollection(db, businessId);
            const ref = doc(offerCollection, id)
            const snap = await getDoc(ref);

            if (!snap.exists()) return null;

            return snap.data();
        } catch (err) {
            throw new Error((err as Error).message || 'Failed to fetch offer');
        }
    },

    /**
     * Fetches an offer by its ID.
     * @param offerId The ID of the offer to fetch.
     * @returns 
     */
    async fetch(offerId: string): Promise<Offer | null> {
        try {
            const offerCollection = createOffersGroupCollection(db);
            const ref = query(offerCollection, where('id', '==', offerId));
            const snap = await getDocs(ref);

            if (snap.empty) return null

            return snap.docs[0].data();
        } catch (err: any) {
            console.warn(err.message);
            throw new Error('Failed to fetch offer')
        }
    },

    /**
     * Writes an offer to the database. If the offer has an empty ID, it will create a new offer; otherwise, it will update the existing offer.
     * @param data The offer data to write to the database.
     * @returns 
     */
    async write(data: Offer): Promise<Offer> {
        try {
            let offer = newOffer(data);

            const isUpdate = offer.id !== '';

            if (isUpdate) {
                const updateOfferFn = httpsCallable<{
                    offerId: string;
                    businessId: string;
                    updates: Partial<Offer>;
                }, { success: boolean; message: string }>(functions, 'adminUpdateOffer');

                await updateOfferFn({
                    offerId: offer.id,
                    businessId: offer.business.id,
                    updates: {
                        price: offer.price,
                        date: offer.date,
                        endDate: offer.endDate,
                        duration: offer.duration,
                        description: offer.description,
                        maxPax: offer.maxPax,
                        minPax: offer.minPax,
                        documents: offer.documents,
                        inclusions: offer.inclusions,
                        thingsToBring: offer.thingsToBring,
                        reminders: offer.reminders,
                        schedule: offer.schedule,
                    }
                });

                return offer;
            } else {
                const col = createOffersCollection(db, data.business.id);

                const businessOfferRef = doc(col);



                offer.id = businessOfferRef.id;

                await setDoc(businessOfferRef, offer, { merge: true });

                return offer;
            }
        } catch (err: any) {
            console.warn(err.message);
            throw new Error(err.message ?? 'Failed creating offer')
        }
    },

    /**
     * Fetches similar offers based on the provided offer.
     * @param offer - The offer object used to find similar offers. Similarity is determined based on the trail ID, business ID, and hike date of the provided offer.
     * @returns 
     */
    async fetchSimilarOffers(offer: Offer): Promise<Offer[]> {
        try {
            const offerCollection = createOffersGroupCollection(db);

            const q = query(
                offerCollection,
                or(
                    where('trail.id', '==', offer.trail.id),
                    where('price', '==', offer.price),
                    where('date', '==', offer.date)
                )
            )

            const snap = await getDocs(q);

            if (snap.empty) return [];
            return snap.docs.map(doc => doc.data());
        } catch (err) {
            throw err;
        }
    },

    /**
     * Deletes an offer from the database.
     * @param OfferParams An object containing the offer ID and business ID.
     * @returns
     */
    async delete({ id, businessId }: OfferParams): Promise<void> {
        try {
            const offerCollection = createOffersCollection(db, businessId)
            const docRef = doc(offerCollection, id);

            await deleteDoc(docRef);
        } catch (err: any) {
            console.warn(err.message);
            throw new Error(err.message ?? 'Failed deleting');
        }
    }
});

export const OfferRepo = OfferRepository(db);
