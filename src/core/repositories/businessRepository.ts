import { db } from '@/src/core/config/Firebase';
import { BusinessDB, BusinessUI } from '@/src/types/entities/Business';
import { UserDB, UserUI } from '@/src/types/entities/User';
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BaseRepository } from '../interface/repositoryInterface';
import { BusinessMapper } from '../mapper/businessMapper';
import { UserMapper } from '../mapper/userMapper';

export type AdminParams = {
    userId: string,
    businessId: string,
}

export interface BusinessRepository extends BaseRepository<BusinessUI>{
    fetchBusinessAdmins(id: string): Promise<UserUI[]>
    createBusinessAdmin(...args: any[]): Promise<void>;
}

const businessCollection = collection(db, 'businesses').withConverter({
    toFirestore: (business: BusinessDB) => business,
    fromFirestore: (snapshot): BusinessDB => snapshot.data() as BusinessDB
}); 

class BusinessRepositoryImpl implements BusinessRepository{
    async fetchAll(...args: any[]): Promise<BusinessUI[]> {
        try{
            const snapshot = await getDocs(businessCollection);
            return snapshot.docs.map((docsnap) => BusinessMapper.toUI(docsnap.data())); 
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching all businesses');
        }
    }

    async fetchById(id: string, ...args: any[]): Promise<BusinessUI | null> {
        try{
            const ref = doc(businessCollection, id);
            
            const snap = await getDoc(ref);
            
            if(!snap.exists()) return null;
            
            return BusinessMapper.toUI(snap.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    }
    
    async write(data: BusinessUI, ...args: any[]): Promise<BusinessUI> {
        const functions = getFunctions();

        const createBusiness = httpsCallable(functions, 'createBusiness');

        try{
            const businessDB = BusinessMapper.toDB({
                    ...data,
                active: true
            });

            const result = await createBusiness(businessDB);
            
            if(!result) throw new Error('Failed creating business');

            return BusinessMapper.toUI(businessDB);
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    }

    async delete(id: string, ...args: any[]): Promise<void> {
        try{
            const docRef = doc(db, 'businesses', id);
            const docsnap = await getDoc(docRef);

            await setDoc(docRef, {
                active: false,
            }, {merge: true});
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    }

    async fetchBusinessAdmins(id: string): Promise<UserUI[]> {
        try {
            const ref = collection(db, 'businesses', id, 'admins');
            const snapshot = await getDocs(ref);
        
            return snapshot.docs.map((docsnap) => UserMapper.toUI(docsnap.data() as UserDB));
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching all businesses');
        }
    }

    async createBusinessAdmin({userId, businessId}: AdminParams){
        const functions = getFunctions();
    
        const createAdmin = httpsCallable(functions, 'createAdmin');
    
        try {
            if(!userId || !businessId) throw new Error('Missing user or business id');
    
            const uid = await createAdmin({userId, businessId})
            
            if(!uid) throw new Error('Admin creation failed');

        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching all businesses');
        }
    }
}

export const BusinessRepository = new BusinessRepositoryImpl();