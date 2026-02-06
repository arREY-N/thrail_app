import { db } from '@/src/core/config/Firebase';
import { OfferMapper } from '@/src/core/mapper/offerMapper';
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';

export async function fetchOffers(businessId){
    try {
        const snapshot = await getDocs(collection(db, 'businesses', businessId, 'offers'));

        if(snapshot.empty) return [];
        
        return snapshot.docs.map((docsnap) => OfferMapper.toUI(docsnap.data()));
    } catch (err) {
        console.error(err.message);
        throw new Error('Failed to fetch offer')
    }
}

export async function fetchOfferById(businessId, offerId){
    try {
        const ref = doc(db, 'businessess', businessId, 'offers', offerId);
        const snap = await getDoc(ref);

        if(!snap.exists()) return null;

        return OfferMapper.toUI(snap.data());
    } catch (err) {
        console.error(err.message);
        throw new Error('Failed to fetch offer ', id)
    }
}

export async function createNewOffer(data){
    try {
        const offer = OfferMapper.toDB(data);
        
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
    } catch (err) {
        console.error(err.message);
        throw new Error(err.message ?? 'Failed creating offer')
    }
}

export async function deleteOffer(offerId, businessId){
    try {
        const docRef = doc(db, 'businesses', businessId, 'offers', offerId)
        await deleteDoc(docRef);

        return offerId;
    } catch (err) {
        console.error(err.message);
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
        
        return querySnapshot.docs.map((doc) => OfferMapper.toUI(doc.data()));
    } catch (err) {
        console.error(err.message);
        throw new Error(err.message || 'Failed fetching offer for ', id)
    }
}
