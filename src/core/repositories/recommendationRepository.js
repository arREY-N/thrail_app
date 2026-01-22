import { db } from '@/src/core/config/Firebase';
import getRecoID from '@/src/core/domain/recommendationDomain';
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

export async function fetchCurrentRecommendation(uid){
    try{
        if(!uid) throw new Error('UID or Recommendation ID missing.');

        const recoID = getRecoID();

        const ref = doc(db, 'users', uid, 'recommendations', recoID);    
        const snapshot = await getDoc(ref);
        
        if(!snapshot.exists()) {
            console.log('Current recommendation is not yet ready');
            return;
        }
        
        return {
            id: snapshot.id,
            ...snapshot.data(),
        }
    } catch (err) {
        console.log(err);
        return [];
    }
}