import { db } from '@/src/core/config/Firebase';
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

export async function fetchOffers(businessId){
    try {
        const snapshot = await getDocs(collection(db, 'businesses', businessId, 'offers'));

        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data()
        }));
    } catch (err) {
        throw new Error('Failed to fetch offer')
    }
}

export async function fetchOfferById(businessId, offerId){
    try {
        const ref = doc(db, 'businessess', businessId, 'offers', offerId);
        const snap = await getDoc(ref);

        if(!snap.exists()) return null;

        return{
            id: snap.id,
            ...snap.data(),
        }
    } catch (err) {
        throw new Error('Failed to fetch offer ', id)
    }
}


export async function createNewOffer(offer){
    try {
        const businessOfferRef = offer.id
            ? doc(db, 'businesses', offer.businessId, 'offers', offer.id)
            : doc(collection(db, 'businesses', offer.businessId, 'offers'));
        
        const businessOfferData = {
            ...offer,
            id: businessOfferRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }
        await setDoc(businessOfferRef, businessOfferData, {merge: true});
        return businessOfferData;
    } catch (err) {
        throw new Error(err.message ?? 'Failed creating offer')
    }
}

export async function deleteOffer(offerId, businessId){
    try {
        const docRef = doc(db, 'businesses', businessId, 'offers', offerId)
        await deleteDoc(docRef);

        const offerRef = doc(db, 'offers', offerId);
        await deleteDoc(offerRef);
        return offerId;
    } catch (err) {
        throw new Error(err.message ?? 'Failed deleting ', id);
    }
}

export async function fetchOfferForTrail(id){
    try {
        if(!id)
            throw new Error('Trail ID missing'); 

        const ref = collectionGroup(db, 'offers');
        const q = query(ref, where('trail.id', '==', id));

        const querySnapshot = await getDocs(q);

        if(querySnapshot.empty) return [];
        
        return querySnapshot.docs.map((doc) => {
            return{
                id: doc.id,
                ...doc.data()
            }
        });
    } catch (err) {
        throw new Error(err.message || 'Failed fetching offer for ', id)
    }
}
