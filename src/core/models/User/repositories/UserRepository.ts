import { db } from "@/src/core/config/Firebase";
import { User } from "@/src/core/models/User/interfaces/User.types";
import { userConverter } from "@/src/core/models/User/utils/UserFactory";
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

const createUsersCollection = (db: Firestore) => {
    return collection(db, 'users').withConverter(userConverter);
};

export const UserRepository = (db: Firestore) => ({
    /**
     * Fetches all users.
     */
    async fetchAll(): Promise<User[]> {
        try {
            const col = createUsersCollection(db);
            const snapshot = await getDocs(col);
            if (snapshot.empty) return [];
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while fetching all users.');
        }
    },

    /**
     * Fetches a user by ID.
     */
    async fetchById(id: string): Promise<User | null> {
        try {
            if (!id) return null;
            const col = createUsersCollection(db);
            const snap = await getDoc(doc(col, id));
            if (!snap.exists()) return null;
            return snap.data();
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while fetching user.');
        }
    },

    /**
     * Writes or updates a user document.
     */
    async write(data: User): Promise<User> {
        try {
            const col = createUsersCollection(db);
            const docRef = data.id ? doc(col, data.id) : doc(col);
            const updated: User = {
                ...data,
                id: data.id || docRef.id,
            };
            await setDoc(docRef, updated, { merge: true });
            return updated;
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('An error occurred while writing user');
        }
    },

    /**
     * Deletes a user by ID.
     */
    async delete(id: string): Promise<void> {
        try {
            if (!id) throw new Error('Invalid user ID');
            const col = createUsersCollection(db);
            const docRef = doc(col, id);
            await deleteDoc(docRef);
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error('Failed deleting user');
        }
    },

    /**
     * Fetches users matching a given email.
     */
    async fetchByEmail(email: string): Promise<User[]> {
        try {
            const col = createUsersCollection(db);
            const q = query(col, where('email', '==', email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return [];
            return querySnapshot.docs.map(docsnap => docsnap.data());
        } catch (err: unknown) {
            if (err instanceof Error) throw err;
            throw new Error(`An error occurred while fetching user with email ${email}`);
        }
    },
});

export const UserRepo = UserRepository(db);
