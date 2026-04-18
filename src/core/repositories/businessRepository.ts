import { db } from '@/src/core/config/Firebase';
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BaseRepository } from '../interface/repositoryInterface';
import { Admin, adminConverter } from '../models/Admin/Admin';
import { Business, businessConverter } from '../models/Business/Business';
import { IBusiness } from '../models/Business/Business.types';
import { User } from '../models/User/User';

export type AdminParams = {
    userId: string,
    businessId: string,
}
export interface BusinessRepository extends BaseRepository<IBusiness>{
    fetchBusinessAdmins(id: string): Promise<Admin[]>
    createBusinessAdmin(...args: any[]): Promise<Admin>;
}

const businessCollection = collection(db, 'businesses').withConverter(businessConverter); 

const createAdminCollection = (id: string) => {
    return collection(db, 'businesses', id, 'admins').withConverter(adminConverter);
}
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
    
        try{        
            const result = await createBusiness({
                data: {
                    ...data.toFirestore(),
                    createdAt: data.createdAt.toISOString(),
                    establishedOn: data.establishedOn.toISOString(),
                },
                applicationId,
            });

            if(!result.data) throw new Error('Failed creating business');
            
            return data;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    }

    async delete(id: string, ...args: any[]): Promise<void> {
        try{
            const docRef = doc(businessCollection, id);

            await updateDoc( 
                docRef, 
                { active: false }
            );
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    }

    async fetchBusinessAdmins(id: string): Promise<Admin[]> {
        try {
            const ref = createAdminCollection(id);
            const snapshot = await getDocs(ref);
        
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching all businesses');
        }
    }

    async createBusinessAdmin(user: User, businessId: string): Promise<Admin>{
        const functions = getFunctions();
    
        const createAdmin = httpsCallable(functions, 'createAdmin');
    
        try {
            if(!user) throw new Error('Missing user');
            
            if(!businessId) throw new Error('Missing business');
    
            const admin = new Admin({
                id: user.id,
                status: 'active',
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            })

            const uid = await createAdmin({
                userId: user.id,
                businessId,
            });
            
            if(!uid) throw new Error('Admin creation failed');

            return admin;
        } catch (err) {
            if(err instanceof Error) throw err;
            throw new Error('Failed fetching all businesses');
        }
    }
}

export const BusinessRepository = new BusinessRepositoryImpl();