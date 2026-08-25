import { db } from "@/src/core/config/Firebase";
import { Mountain } from "@/src/core/models/Mountain/interfaces/Mountain.types";
import { mountainConverter } from "@/src/core/models/Mountain/utils/MountainFactory";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

const createMountainCollection = (db: any) => {
    return collection(db, "mountains").withConverter(mountainConverter);
};

export const MountainRepository = (db: any) => ({
    /**
     * Fetches all mountains.
     */
    async fetchAll(): Promise<Mountain[]> {
        try {
            const col = createMountainCollection(db);
            const snapshot = await getDocs(col);

            if (snapshot.empty) return [];

            return snapshot.docs
                .filter((d) => d.id !== "init")
                .map((docSnap) => docSnap.data());
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed fetching all mountains");
        }
    },

    /**
     * Fetches a mountain by its ID.
     */
    async fetchById(id: string): Promise<Mountain | null> {
        try {
            const col = createMountainCollection(db);
            const docRef = doc(col, id);
            const snapshot = await getDoc(docRef);

            if (!snapshot.exists()) return null;

            return snapshot.data();
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed fetching mountain");
        }
    },

    /**
     * Writes or updates a mountain document.
     */
    async write(data: Mountain): Promise<Mountain> {
        try {
            const col = createMountainCollection(db);
            const docRef = data.id ? doc(col, data.id) : doc(col);

            const updated: Mountain = {
                ...data,
                id: docRef.id,
            };

            await setDoc(docRef, updated, { merge: true });

            return updated;
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed writing mountain");
        }
    },

    /**
     * Deletes a mountain by its ID.
     */
    async delete(id: string): Promise<void> {
        try {
            const col = createMountainCollection(db);
            const docRef = doc(col, id);
            await deleteDoc(docRef);
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error("Failed deleting mountain");
        }
    },

    /**
     * Fetches all mountains located in a given province.
     */
    async fetchMountainByProvince(province: string): Promise<Mountain[]> {
        try {
            const col = createMountainCollection(db);
            const q = query(col, where("province", "array-contains", province));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return [];

            return snapshot.docs.map((docSnap) => docSnap.data());
        } catch (err) {
            if (err instanceof Error) throw err;
            throw new Error(`Failed to fetch mountains in ${province}`);
        }
    },
});

export const MountainRepo = MountainRepository(db);

