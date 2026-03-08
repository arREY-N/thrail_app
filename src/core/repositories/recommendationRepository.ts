import { db } from '@/src/core/config/Firebase';
import getRecoID from '@/src/core/utility/recommendation';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { recommendationConverter } from '../models/Recommendation/Recommendation';

const createUserCollection = (id: string) => {
    return collection(db, 'users', id, 'recommendations').withConverter(recommendationConverter);
}

class RecommendationRepositoryImpl{
    async fetchAll(uid: string) {
        try {
            if(!uid) throw new Error('UID or Recommendation ID missing.');
            const ref = createUserCollection(uid);
            const snapshot = await getDocs(ref);
        
            if (snapshot.empty) return [];
            
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while fetching user recommendations.');
        }
    }

    async fetchCurrent(uid: string){
        try{
            if(!uid) throw new Error('UID or Recommendation ID missing.');
        
            const recoID = getRecoID();
        
            const ref = doc(createUserCollection(uid), recoID);    
            const snapshot = await getDoc(ref);
            
            if(!snapshot.exists()) {
                console.log('Current recommendation is not yet ready');
                return;
            }
            
            return snapshot.data();
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while fetching current user recommendations.');
        }
    }
}

export const RecommendationRepository = new RecommendationRepositoryImpl();