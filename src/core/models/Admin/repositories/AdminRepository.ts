import { db } from "@/src/core/config/Firebase";
import { Admin } from "@/src/core/models/Admin/interfaces/Admin.types";
import { adminConverter, newAdmin } from "@/src/core/models/Admin/utils/AdminFactory";
import { User } from "@/src/core/models/User/User";
import { collection, doc, Firestore, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const createAdminCollection = (db: Firestore, businessId: string) => {
    return collection(db, 'businesses', businessId, 'admins').withConverter(adminConverter);
};

export const AdminRepository = (db: any) => ({
    /**
     * Fetches all business admins for a specific business.
     */
    async fetchAll(businessId: string): Promise<Admin[]> {
        try {
            if (!businessId) throw new Error('Missing business ID');
            const ref = createAdminCollection(db, businessId);
            const snapshot = await getDocs(ref);

            if (snapshot.empty) return [];
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching business admins');
        }
    },

    /**
     * Fetches a single admin by business ID and admin ID.
     */
    async fetchById(businessId: string, adminId: string): Promise<Admin | null> {
        try {
            if (!businessId || !adminId) throw new Error('Missing business ID or admin ID');
            const ref = doc(createAdminCollection(db, businessId), adminId);
            const snapshot = await getDoc(ref);

            if (!snapshot.exists()) return null;
            return snapshot.data();
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed fetching business admin');
        }
    },

    /**
     * Writes or updates an admin document directly.
     */
    async write(businessId: string, admin: Admin): Promise<Admin> {
        try {
            if (!businessId) throw new Error('Missing business ID');
            const adminRef = doc(createAdminCollection(db, businessId), admin.id);
            await setDoc(adminRef, admin, { merge: true });
            return admin;
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed writing admin');
        }
    },

    /**
     * Soft-deletes or removes an admin from a business.
     */
    async delete(businessId: string, adminId: string): Promise<void> {
        try {
            if (!businessId || !adminId) throw new Error('Missing business ID or admin ID');
            const adminRef = doc(createAdminCollection(db, businessId), adminId);
            await updateDoc(adminRef, { status: 'removed' });
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed deleting business admin');
        }
    },

    /**
     * Creates an admin under the business using cloud function.
     */
    async createBusinessAdmin(user: User, businessId: string): Promise<Admin> {
        const functions = getFunctions();
        const createAdminCallable = httpsCallable(functions, 'createAdmin');

        try {
            if (!user) throw new Error('Missing user');
            if (!businessId) throw new Error('Missing business ID');

            const admin = newAdmin({
                id: user.id,
                status: 'active',
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            });

            const uid = await createAdminCallable({
                userId: user.id,
                businessId,
            });

            if (!uid) throw new Error('Admin creation failed');

            return admin;
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed creating business admin');
        }
    },
});

export const AdminRepo = AdminRepository(db);

