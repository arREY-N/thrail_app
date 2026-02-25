import { db } from '@/src/core/config/Firebase';
import { Business, businessConverter, IBusiness } from '@/src/types/entities/Business';
import { UserDB, UserUI } from '@/src/types/entities/User';
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BaseRepository } from '../interface/repositoryInterface';
import { UserMapper } from '../mapper/userMapper';

export type AdminParams = {
    userId: string,
    businessId: string,
}

export interface BusinessRepository extends BaseRepository<IBusiness>{
    fetchBusinessAdmins(id: string): Promise<UserUI[]>
    createBusinessAdmin(...args: any[]): Promise<void>;
}

const businessCollection = collection(db, 'businesses').withConverter(businessConverter); 

class BusinessRepositoryImpl implements BusinessRepository{
    async fetchAll(...args: any[]): Promise<Business[]> {
        try{
            const snapshot = await getDocs(businessCollection);
            return snapshot.docs.map(doc => doc.data()); 
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching all businesses');
        }
    }

    async fetchById(id: string, ...args: any[]): Promise<Business | null> {
        try{
            const ref = doc(businessCollection, id);
            
            const snap = await getDoc(ref);
            
            return snap.data() || null;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    }
    
    async write(data: Business, applicationId: string): Promise<Business> {
        const functions = getFunctions();
        const createBusiness = httpsCallable(functions, 'createBusiness');
        
        const firestoreData = data.toFirestore();

        try{
            console.log(firestoreData, applicationId);
            
            const result = await createBusiness({
                data: firestoreData,
                applicationId,
            });

            if(!result) throw new Error('Failed creating business');
            console.log('repo: ', data);
            return data;
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