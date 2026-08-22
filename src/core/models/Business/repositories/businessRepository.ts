import { Admin, adminConverter, newAdmin } from '@/src/core/models/Admin/Admin';
import { Business } from '@/src/core/models/Business/interfaces/Business.types';
import { businessConverter } from '@/src/core/models/Business/utils/BusinessFactory';
import { User } from '@/src/core/models/User/User';
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';

export type AdminParams = {
    userId: string;
    businessId: string;
};

const createBusinessCollection = (db: any) => {
    return collection(db, 'businesses').withConverter(businessConverter);
};

const createAdminCollection = (db: any, id: string) => {
    return collection(db, 'businesses', id, 'admins').withConverter(adminConverter);
};

export const BusinessRepository = (db: any) => ({
    /**
     * Fetches all registered tour businesses.
     */
    async fetchAll(): Promise<Business[]> {
        try {
            const col = createBusinessCollection(db);
            const snapshot = await getDocs(col);
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => doc.data()); 
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching all businesses');
        }
    },

    /**
     * Fetches a single business by ID.
     */
    async fetchById(id: string): Promise<Business | null> {
        try {
            const col = createBusinessCollection(db);
            const ref = doc(col, id);
            const snap = await getDoc(ref);
            return snap.data() || null;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    },
    
    /**
     * Creates a new business account using cloud function.
     */
    async write(data: Business, applicationId: string): Promise<Business> {
        const functions = getFunctions();
        const createBusiness = httpsCallable(functions, 'createBusiness');
    
        try {
            const result = await createBusiness({
                data: {
                    ...data,
                    createdAt: data.createdAt.toISOString(),
                    establishedOn: data.establishedOn.toISOString(),
                },
                applicationId,
            });

            if (!result.data) throw new Error('Failed creating business');
            
            return data;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    },

    /**
     * Soft-deletes / deactivates a business.
     */
    async delete(id: string): Promise<void> {
        try {
            const col = createBusinessCollection(db);
            const docRef = doc(col, id);

            await updateDoc( 
                docRef, 
                { active: false }
            );
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching business');
        }
    },

    /**
     * Fetches all business admins for a specific business.
     */
    async fetchBusinessAdmins(id: string): Promise<Admin[]> {
        try {
            const ref = createAdminCollection(db, id);
            const snapshot = await getDocs(ref);
        
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching business admins');
        }
    },

    /**
     * Creates an admin under the business using cloud function.
     */
    async createBusinessAdmin(user: User, businessId: string): Promise<Admin> {
        const functions = getFunctions();
        const createAdmin = httpsCallable(functions, 'createAdmin');
    
        try {
            if (!user) throw new Error('Missing user');
            if (!businessId) throw new Error('Missing business');
    
            const admin = newAdmin({
                id: user.id,
                status: 'active',
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            });

            const uid = await createAdmin({
                userId: user.id,
                businessId,
            });
            
            if (!uid) throw new Error('Admin creation failed');

            return admin;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error('Failed creating business admin');
        }
    },
});
