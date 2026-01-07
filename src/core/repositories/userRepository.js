import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
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

export async function fetchUsers(){
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

export async function fetchUserByEmail(email){
    try {
        const userRef = collection(db, 'users');
        const q = query(userRef, where('email', '==', email));
        
        const querySnapshot = await getDocs(q);

        if(querySnapshot.empty){
            return null;
        }

        const results = querySnapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data()
        }))

        return results[0];
    } catch (err) {
        throw new Error(err.message ?? 'Failed fetching', email)
    }
}

export async function deleteUser(id){
    const functions = getFunctions();

    const deleteAccount = httpsCallable(functions, 'deleteUser');

    try {
        const result = await deleteAccount({userId: id});
        return result.data.success;
    } catch (err) {
        throw new Error(err.message ?? 'Failed deleting ', id)
    }
}