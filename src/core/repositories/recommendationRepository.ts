import { db } from '@/src/core/config/Firebase';
import getRecoID from '@/src/core/utility/recommendation';
import { RecommendationDB } from '@/src/types/entities/Recommendation';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { RecommendationMapper } from '../mapper/recommendationMapper';

const usersCollection = collection(db, 'users');

class RecommendationRepositoryImpl{
    async fetchAll(
        uid: string
    ) {
        try {
            const ref = collection(usersCollection, uid, 'recommendations');
            const snapshot = await getDocs(ref);
        
            if (snapshot.empty) return [];
            
            return snapshot.docs.map((docsnap) => RecommendationMapper.toUI({
                id: docsnap.id,
                ...docsnap.data() as RecommendationDB,
            }));
        } catch (err: unknown) {
            if(err instanceof Error) throw err;
            throw new Error('An error occurred while fetching user recommendations.');
        }
    }

    async fetchCurrent(
        uid: string
    ){
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
}

export const RecommendationRepository = new RecommendationRepositoryImpl();