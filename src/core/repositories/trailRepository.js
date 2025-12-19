import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

const trailsCollection = collection(db, 'trail');

/**
 * Fetch all trails
 * @returns {Promise<Trail[]>}
 */

export async function fetchAllTrails(){
    try {
        const snapshot = await getDocs(trailsCollection);

        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data(),
        }));
    } catch (err) {
        throw new Error('Failed to fetch trails');
    }
}

/**
 * Fetch a single trail by ID
 * @param {string} id
 * @returns {Promise<Trail|null>}
 */
export async function fetchTrailById(id){
    try {
        const ref = doc(db, 'trail', id);
        const snap = await getDoc(ref);

        if(!snap.exists()) return null;
        
        return {
            id: snap.id,
            ...snap.data()
        }
    } catch (err) {
        throw new Error('Failed to fetch trail ', id)
    }
}

