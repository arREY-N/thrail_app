import { db } from '@/src/core/config/Firebase';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const trailsCollection = collection(db, 'trails');

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
        throw new Error(err);
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
        throw new Error(err)
    }
}

export async function createTrail(trailData){
    try {
        const doc = await addDoc(trailsCollection, trailData);

        return {
            id: doc.id,
            ...trailData
        }
    } catch (err) {
        throw new Error(err)
    }
}

export async function saveTrail(trailData){
    try {
        const docRef = trailData.id 
        ? doc(db, 'trails', trailData.id)
        : doc(collection(db, 'trails'));

        await setDoc(docRef, { ...trailData, id:docRef.id }, { merge: true });

        return {
            ...trailData,
            id: docRef.id,
        }
    } catch (err) {
        throw new Error(err);
    }
}

export async function deleteTrail(id){
    try {
        const docRef = doc(db, 'trails', id);
        await deleteDoc(docRef);
        return id;
    } catch (err) {
        throw new Error(err);
    }
}