import { Trail } from "@/src/core/models/Trail/interfaces/Trail.types";
import { trailConverter } from "@/src/core/models/Trail/utils/TrailFactory";
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, setDoc } from "firebase/firestore";

const createTrailsCollection = (db: Firestore) => {
    return collection(db, 'trails').withConverter(trailConverter);
};

export const TrailRepository = (db: Firestore) => ({
    /**
     * Fetches all trails from Firestore.
     * @returns Promise<Trail[]>
     */
    async fetchAll(): Promise<Trail[]> {
        try {
            const trailsCollection = createTrailsCollection(db);
            const snapshot = await getDocs(trailsCollection);
            if (snapshot.empty) return [];
            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            console.error("Error fetching all trails from Firestore:", err);
            if (err instanceof Error) throw err;
            throw new Error('An error occurred');
        }
    },

    /**
     * Fetches a trail by its ID from Firestore.
     * @param id - The ID of the trail to fetch.
     * @returns Promise<Trail | null>
     */
    async fetchById(id: string): Promise<Trail | null> {
        try {
            const trailsCollection = createTrailsCollection(db);
            const ref = doc(trailsCollection, id);
            const snap = await getDoc(ref);

            if (!snap.exists()) return null;

            return snap.data();
        } catch (err) {
            console.error(`Error fetching trail by ID (${id}) from Firestore:`, err);
            if (err instanceof Error) throw err;
            throw new Error('An error occurred');
        }
    },

    /**
     * Writes a trail to Firestore. If the trail has an empty ID, it creates a new document; otherwise, it merges/updates the existing document.
     * @param data - The trail object to write.
     * @returns Promise<Trail>
     */
    async write(data: Trail): Promise<Trail> {
        try {
            const trailsCollection = createTrailsCollection(db);
            const create = data.id === '';

            const docRef = create
                ? doc(trailsCollection)
                : doc(trailsCollection, data.id);

            const updated: Trail = {
                ...data,
                id: create ? docRef.id : data.id,
            };

            await setDoc(docRef, updated, { merge: true });

            return updated;
        } catch (err) {
            console.error("Error writing trail to Firestore:", err);
            if (err instanceof Error) throw err;
            throw new Error('An error occurred');
        }
    },

    /**
     * Deletes a trail by ID from Firestore.
     * @param id - The ID of the trail to delete.
     * @returns Promise<void>
     */
    async delete(id: string): Promise<void> {
        try {
            const trailsCollection = createTrailsCollection(db);
            const docRef = doc(trailsCollection, id);
            await deleteDoc(docRef);
        } catch (err) {
            console.error(`Error deleting trail (${id}) from Firestore:`, err);
            if (err instanceof Error) throw err;
            throw new Error('An error occurred');
        }
    },

    /**
     * Retrieves map data for a trail.
     * @param id - The ID of the trail.
     */
    async getMap(id: string): Promise<any> {
        console.log('Map for ', id);
        return { map: 'Map to be added' };
    }
});
