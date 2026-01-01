import { db } from '@/src/core/config/Firebase';
import { addDoc, collection, getDoc, getDocs, serverTimestamp } from "firebase/firestore";

export async function fetchAllBusinesses(){
    try{
        const ref = collection(db, 'businesses');

        const snapshot = await getDocs(ref);

        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data()
        })); 
    } catch (err) {
        throw new Error(err);
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
        const refData = await addDoc(collection(db, 'businesses'), {
            ...businessData,
            createdAt: serverTimestamp()
        })

        console.log('ID: ', refData.id);
        
        return refData.id;
    } catch (err) {
        throw new Error(err);
    }
}

export async function createBusinessApplication(businessData){
    try{
        const refData = await addDoc(collection(db, 'applications'), {
            ...businessData,
            approved: false,
            createdAt: serverTimestamp()
        })

        console.log('Application received: ', refData.id);
        return refData.id;
    } catch (err) {
        throw new Error(err);
    }
}
