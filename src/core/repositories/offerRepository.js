import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

const offersCollection = collection(db, 'offer');

/**
 * Fetch all offers
 * @returns {Promise<Offer[]>}
 */

export async function fetchAllOffers(){
    try {
        const snapshot = await getDocs(offersCollection);

        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data()
        }));
    } catch (err) {
        throw new Error('Failed to fetch offer')
    }
}

/**
 * Fetch a single offer by ID
 * @param {string} id
 * @returns {Promise<Offer|null>}
 */
export async function fetchOfferById(id){
    try {
        const ref = doc(db, 'offer', id);
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