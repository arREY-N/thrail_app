import { db } from '@/src/core/config/Firebase';
import { Repository } from '@/src/core/interface/repositoryInterface';
import { OfferMapper } from '@/src/core/mapper/offerMapper';
import { OfferDB, OfferUI } from '@/src/types/entities/Offer';
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

type OfferParams = {
    id: string,
    businessId: string,
}

const createOffersCollection = (businessId: string) => {
    return collection(db, 'businesses', businessId, 'offers').withConverter({
        toFirestore: (offer: OfferDB) => offer,
        fromFirestore: (snapshot): OfferDB => snapshot.data() as OfferDB
    });
} 

const createOffersGroupCollection = () => {    
    return collectionGroup(db, 'offers').withConverter({
        toFirestore: (offer: OfferDB) => offer,
        fromFirestore: (snapshot): OfferDB => snapshot.data() as OfferDB
    });
} 

class OfferRepositoryImpl implements Repository<OfferUI>{
    async fetchAll(): Promise<OfferUI[]> {
        try {
            const offerCollection = createOffersGroupCollection();
            const snapshot = await getDocs(offerCollection);

            if(snapshot.empty) return [];
            
            return snapshot.docs.map((docsnap) => OfferMapper.toUI(docsnap.data()));
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('Failed to fetch offer')
        }
    }

    async fetchAllBusinessOffers(businessId: string): Promise<OfferUI[] | []> {
        try {
            const offerCollection = createOffersCollection(businessId);
            const snapshot = await getDocs(offerCollection);

            if(snapshot.empty) return [];
            
            return snapshot.docs.map((docsnap) => OfferMapper.toUI(docsnap.data()));
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business offers')
        }
    }

    async fetchAllTrailOffers(trailId: string): Promise<OfferUI[] | []>{
        try {
            if(!trailId) throw new Error('Trail ID missing'); 

            const ref = collectionGroup(db, 'offers');
            const q = query(ref, where('trail.id', '==', trailId));

            const querySnapshot = await getDocs(q);

            if(querySnapshot.empty) return [];
            
            return querySnapshot.docs.map((doc) => OfferMapper.toUI(doc.data() as OfferDB));
        } catch (err: any) {
            console.error(err.message);
            throw new Error(err.message || 'Failed fetching offer for')
        }
    }

    
    async fetchById({id, businessId}: OfferParams): Promise<OfferUI | null> {
        try {
            const offerCollection = createOffersCollection(businessId);
            const ref = doc(offerCollection, id)
            const snap = await getDoc(ref);

            if(!snap.exists()) return null;

            return OfferMapper.toUI(snap.data());
        } catch (err: any) {
            console.error(err.message);
            throw new Error('Failed to fetch offer')
        }
    }

    async write(data: OfferUI): Promise<OfferUI> {
        try {
            const offer = OfferMapper.toDB(data);
            console.log(offer);
            const businessOfferRef = offer.id
                ? doc(db, 'businesses', offer.business.id, 'offers', offer.id)
                : doc(collection(db, 'businesses', offer.business.id, 'offers'));

            const businessOfferData = {
                ...offer,
                id: businessOfferRef.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }
            
            await setDoc(businessOfferRef, businessOfferData, {merge: true});
            return OfferMapper.toUI(businessOfferData);
        } catch (err: any) {
            console.error(err.message);
            throw new Error(err.message ?? 'Failed creating offer')
        }
    }

    async delete({id, businessId}: OfferParams): Promise<void> {
        console.log(id, businessId);
        try {
            const offerCollection = createOffersCollection(businessId)
            const docRef = doc(offerCollection, id)
            await deleteDoc(docRef);
        } catch (err: any) {
            console.error(err.message);
            throw new Error(err.message ?? 'Failed deleting');
        }
    }
}

export const OfferRepository = new OfferRepositoryImpl; 