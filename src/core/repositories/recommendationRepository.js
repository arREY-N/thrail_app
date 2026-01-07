import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function fetchUserRecommendations(uid){
    try {
        const ref = collection(db, 'users', uid, 'recommendations');
        const snapshot = await getDocs(ref);

        if (snapshot.empty) return [];
        
        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data(),
        }));
    } catch (err) {
        throw new Error(err.message);
    }
}

export async function fetchMonthRecommendation(uid, recoID){
    try{
        if(!uid || !recoID) throw new Error('UID or Recommendation ID missing.');

        const ref = doc(db, 'users', uid, 'recommendations', recoID);    
        const snapshot = await getDoc(ref);
        
        if(!snapshot.exists()) {
            throw new Error('Current recommendation is not yet ready')
        }
        
        return {
            id: snapshot.id,
            ...snapshot.data(),
        }
    } catch (err) {
        console.error('Error: ', err);
        return [];
    }
}