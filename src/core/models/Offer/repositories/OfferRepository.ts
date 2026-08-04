import { createOffer, Offer, offerConverter } from "@/src/core/models/Offer/Offer";
import { OfferParams } from "@/src/core/models/Offer/Offer.types";
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const createOffersCollection = (db: any, businessId: string) => {
    return collection(db, 'businesses', businessId, 'offers').withConverter(offerConverter);
} 

const createOffersGroupCollection = (db: any) => {    
    return collectionGroup(db, 'offers').withConverter(offerConverter);
} 

export const OfferRepository = (db: any) => ({
    async fetchAll(): Promise<Offer[]> {
        try {
            const offerCollection = createOffersGroupCollection(db);
            const snapshot = await getDocs(offerCollection);
            
            if(snapshot.empty) return [];
            
            console.log('Sucessfully fetched all offers');
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('Failed to fetch offer')
        }
    },

    async fetchAllBusinessOffers(businessId: string): Promise<Offer[] | []> {
        try {
            const offerCollection = createOffersCollection(db, businessId);
            const snapshot = await getDocs(offerCollection);
            
            if(snapshot.empty) return [];
            
            console.log('Sucessfully fetched offers for business: ', businessId);
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business offers')
        }
    },

    async fetchAllTrailOffers(trailId: string): Promise<Offer[] | []>{
        try {
            if(!trailId) throw new Error('Trail ID missing'); 

            const ref = collectionGroup(db, 'offers');
            const q = query(ref, where('trail.id', '==', trailId));

            const querySnapshot = await getDocs(q);

            if(querySnapshot.empty) return [];
            
            console.log('Sucessfully fetched offers for trail: ', trailId);
            return querySnapshot.docs.map(docsnap => docsnap.data() as Offer);
        } catch (err: any) {
            console.error(err.message);
            throw new Error(err.message || 'Failed fetching offer for')
        }
    },

    
    async fetchById({id, businessId}: OfferParams): Promise<Offer | null> {
        try {
            const offerCollection = createOffersCollection(db, businessId);
            const ref = doc(offerCollection, id)
            const snap = await getDoc(ref);

            if(!snap.exists()) return null;

            console.log('Sucessfully fetched offer: ', snap.id);
            return snap.data();
        } catch (err: any) {
            console.error(err.message);
            throw new Error('Failed to fetch offer')
        }
    },
    
    async fetch(offerId: string): Promise<Offer | null> {
        try {
            const offerCollection = createOffersGroupCollection(db);
            const ref = query(offerCollection, where('id', '==', offerId));
            const snap = await getDocs(ref);

            if(snap.empty) {
                console.log('No offer found in repo', offerId);
                return null
            };

            console.log('Sucessfully fetched offer: ', snap.docs[0].id);
            return snap.docs[0].data();
        } catch (err: any) {
            console.error(err.message);
            throw new Error('Failed to fetch offer')
        }
    },

    async write(data: Offer): Promise<Offer> {
        try {            
            let offer = createOffer(data);

            const create = offer.id === '';

            const col = createOffersCollection(db, data.business.id);

            const businessOfferRef = create
                ? doc(col)
                : doc(col, data.id);

            if(create) offer.id = businessOfferRef.id;
            
            await setDoc(businessOfferRef, offer, {merge: true});

            if(!create) {
                // TODO: implement notification to reserved users about the changes in the offer
                alert('notify reserved users about the changes');
            }
            console.log('Created offer: ', offer)
            return offer;
        } catch (err: any) {
            console.error(err.message);
            throw new Error(err.message ?? 'Failed creating offer')
        }
    },

    async delete({id, businessId}: OfferParams): Promise<void> {
        try {
            const offerCollection = createOffersCollection(db, businessId)
            const docRef = doc(offerCollection, id);

            await deleteDoc(docRef);
        } catch (err: any) {
            console.error(err.message);
            throw new Error(err.message ?? 'Failed deleting');
        }
    }
})