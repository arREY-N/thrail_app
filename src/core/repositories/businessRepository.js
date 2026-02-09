import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';

export async function fetchBusinesses(){
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

export async function fetchBusiness(id){
    try{
        const ref = doc(db, 'businesses', id);
        
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

export async function createBusiness(businessData){
    const functions = getFunctions();

    const createBusiness = httpsCallable(functions, 'createBusiness');

    try{
        const result = await createBusiness({
            ...businessData,
            active: true,
        });
        
        return result.data;
    } catch (err) {
        throw new Error(err);
    }
}

export async function deactivateBusiness(id){
    try{
        const docRef = doc(db, 'businesses', id);
        const docsnap = await getDoc(docRef);

        await setDoc(docRef, {
            active: false,
        }, {merge: true});

        return {
            ...docsnap.data(),
            active: false
        }
    } catch (err) {
        throw new Error(err.message);
    }
}

export async function fetchBusinessAdmins(businessId){
    try {
        const ref = collection(db, 'businesses', businessId, 'admins');
        const snapshot = await getDocs(ref);
    
        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data()
        }));
    } catch (err) {
        throw new Error(err.message);
    }
}

export async function createBusinessAdmin({userId, businessId}){
    const functions = getFunctions();

    const createAdmin = httpsCallable(functions, 'createAdmin');

    try {
        if(!userId || !businessId) throw new Error('Missing user or business id');

        const uid = await createAdmin({userId, businessId})
        
        if(!uid) throw new Error('Admin creation failed');

        return uid;
    } catch (err) {
        throw new Error(err.message)
    }
}