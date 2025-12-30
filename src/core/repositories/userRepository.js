import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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

export async function fetchAllUsers(){
    try{
        const ref = collection(db, 'users');
        const snap = await getDocs(ref);

        return snap.docs.map((user) => ({
            id: user.id,
            ...user.data()
        }));

    } catch (err) {
        throw new Error('Failed retrieving all users', err);
    }
}