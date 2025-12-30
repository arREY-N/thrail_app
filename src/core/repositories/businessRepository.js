import { db } from '@/src/core/config/Firebase';
import { addDoc, collection, getDoc, getDocs, serverTimestamp } from "firebase/firestore";

export async function fetchBusinesses(){
    try{
        const ref = collection(db, 'business');

        const snapshot = await getDocs(ref);

        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data()
        })); 
    } catch (err) {
        throw new Error(err.message);
    }
} 

export async function fetchBusinessAccount(id){
    try{
        const ref = collection(db, 'business', id);
        const snap = await getDoc(ref);

        if(!snap.exists()) return null;
        
        return {
            id: snap.id,
            ...snap.data()
        }
    } catch (err) {
        throw new Error(err.message);
    }
}

export async function createBusinessAccount(businessData){
    try{
        const refData = await addDoc(collection(db, 'business'), {
            ...businessData,
            createdAt: serverTimestamp()
        })

        console.log('ID: ', refData.id);
        
        return refData.id;
    } catch (err) {
        throw new Error(err);
    }
}