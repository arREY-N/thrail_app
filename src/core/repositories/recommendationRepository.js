import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function fetchUserRecommendations(uid){
    try {
        const ref = collection(db, 'user', uid, 'recomendation');
    
        const snapshot = await getDocs(ref);

        if (snapshot.empty) return [];
    
        return snapshot.docs.map((docsnap) => ({
            id: docsnap.id,
            ...docsnap.data(),
        }));
    } catch (err) {
        console.error('Error: fetching recommendations: ', err);
        throw new Error(err);
    }
}

export async function fetchMonthRecommendation(uid, recoID){
    
    try{
        console.log(`user/${uid}/recommendation/${recoID}`);
        
        const ref = doc(db, 'users', uid, 'recommendation', recoID);
        
        const snapshot = await getDoc(ref);
        
        if(!snapshot.exists()) {
            console.log('snap does not exists');    
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data(),
        }
    } catch (err) {
        console.error('Error fetching recommendation ', recoID);
        throw new Error(err);
    }
}