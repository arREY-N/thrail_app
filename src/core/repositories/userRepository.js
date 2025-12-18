import { db } from '@/src/core/config/Firebase';
import { doc, getDoc } from "firebase/firestore";
/**
 * Fetch user by ID 
 * @param {string} id
 * @returns {Promise<User|null}>
 */
export async function fetchUserById(id){
    try {
        const ref = doc(db, 'users', id);
        const snap = await getDoc(ref);

        if(!snap.exists()) return null;

        return {
            id: snap.id,
            ...snap.data()
        }
    } catch (err) {
        throw new Error('Failed to fetch user ', id);
    }
}