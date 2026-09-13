import { db } from "@/src/core/config/Firebase";
import { Hike } from "@/src/core/models/Hike/interfaces/Hike.types";
import { hikeConverter } from "@/src/core/models/Hike/utils/HikeFactory";
import { Location, locationConverter } from "@/src/core/models/Location/Location";
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, setDoc, Timestamp, Unsubscribe } from "firebase/firestore";
const createHikesCollection = (db: Firestore, userId: string) => {
    return collection(db, "users", userId, "hikes").withConverter(hikeConverter);
};

export const HikeRepository = (db: Firestore) => ({
    /**
     * Fetches all hikes for a specific user from Firestore.
     * @param userId - The ID of the user.
     * @returns Promise<Hike[]>
     */
    async fetchAll(userId: string): Promise<Hike[]> {
        try {
            const userHikesRef = createHikesCollection(db, userId);
            const snapshot = await getDocs(userHikesRef);

            if (snapshot.empty) return [];

            return snapshot.docs.map(docsnap => docsnap.data());
        } catch (err) {
            console.error("Error fetching hikes: ", err);
            if (err instanceof Error) throw err;
            throw new Error("Failed fetching hikes");
        }
    },

    /**
     * Fetches a single hike by ID for a specific user.
     * @param userId - The ID of the user.
     * @param hikeId - The ID of the hike to fetch.
     * @returns Promise<Hike | null>
     */
    async fetchById(userId: string, hikeId: string): Promise<Hike | null> {
        try {
            const docRef = doc(createHikesCollection(db, userId), hikeId);
            const snapshot = await getDoc(docRef);

            return snapshot.data() || null;
        } catch (err) {
            console.error("Error fetching hike by ID: ", err);
            if (err instanceof Error) throw err;
            throw new Error("Failed fetching hike");
        }
    },

    /**
     * Writes or updates a hike for a specific user.
     * @param hike - The hike object to write.
     * @param userId - The ID of the user.
     * @returns Promise<Hike>
     */
    async write(hike: Hike, userId: string): Promise<Hike> {
        try {
            const userHikesRef = createHikesCollection(db, userId);
            const isNew = !hike.id || hike.id === "";
            const docRef = isNew
                ? doc(userHikesRef)
                : doc(userHikesRef, hike.id);

            const updated: Hike = {
                ...hike,
                id: isNew ? docRef.id : hike.id,
            };

            await setDoc(docRef, updated, { merge: true });

            return updated;
        } catch (error) {
            console.error("Error writing hike: ", error);
            if (error instanceof Error) throw error;
            throw new Error("Failed writing hike");
        }
    },

    /**
     * Writes tracking coordinates for an active hike.
     * @param userId - The ID of the user.
     * @param hikeId - The ID of the hike.
     * @param coordinates - Array of coordinates to save.
     */
    async writeCoordinates(userId: string, hikeId: string, coordinates: Location[]): Promise<void> {
        try {
            if (!coordinates || coordinates.length === 0) return;

            const lastTimestamp = coordinates[coordinates.length - 1].timestamp;
            const docId = lastTimestamp.getTime().toString();
            const coordRef = doc(collection(db, "users", userId, "hikes", hikeId, "coordinates"), docId);

            const coordinatesData = coordinates.map(locationConverter.toFirestore);

            await setDoc(
                coordRef,
                {
                    coordinates: coordinatesData,
                    lastCoordinate: Timestamp.fromDate(lastTimestamp),
                },
            );
        } catch (error) {
            console.error("Error writing coordinates: ", error);
            if (error instanceof Error) throw error;
            throw new Error("Failed writing coordinates");
        }
    },

    /**
     * Deletes a hike by ID for a user.
     * @param id - The ID of the hike to delete.
     * @param userId - The ID of the user.
     */
    async delete(id: string, userId: string): Promise<void> {
        try {
            const docRef = doc(createHikesCollection(db, userId), id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting hike: ", error);
            if (error instanceof Error) throw error;
            throw new Error("Failed deleting hike");
        }
    },

    /**
     * Shares a live location coordinate to a group.
     * @param userId - The ID of the user.
     * @param groupId - The ID of the group.
     * @param coordinate - The location coordinate to publish.
     */
    async shareLocation(userId: string, groupId: string, coordinate: Location): Promise<void> {
        try {
            const locationRef = doc(collection(db, "groups", groupId, "liveLocations"), userId).withConverter(locationConverter);

            await setDoc(
                locationRef,
                coordinate,
                { merge: true }
            );
        } catch (error) {
            console.error("Error sharing location: ", error);
            if (error instanceof Error) throw error;
            throw new Error("Failed sharing location");
        }
    },

    /**
     * Deletes a user's live location coordinate from a group.
     * @param userId - The ID of the user.
     * @param groupId - The ID of the group.
     */
    async deleteLocation(userId: string, groupId: string): Promise<void> {
        try {
            const locationRef = doc(collection(db, "groups", groupId, "liveLocations"), userId);
            await deleteDoc(locationRef);
        } catch (error) {
            console.error("Error deleting group location: ", error);
        }
    },

    /**
     * Subscribes to real-time updates for group live locations.
     * @param groupId - The ID of the group.
     * @param onUpdate - Callback invoked with latest locations.
     * @returns Unsubscribe function
     */
    listenToLocations(groupId: string, onUpdate: (locations: Location[]) => void): Unsubscribe {
        try {
            const q = collection(db, "groups", groupId, "liveLocations").withConverter(locationConverter);

            return onSnapshot(
                q,
                (snapshot) => {
                    const locations = snapshot.docs.map(docsnap => {
                        const locationInstance = docsnap.data();
                        (locationInstance as any).id = docsnap.id;
                        return locationInstance;
                    });
                    onUpdate(locations);
                },
                (error) => {
                    console.error("Error listening to locations: ", error);
                }
            );
        } catch (error) {
            console.error("Error setting up location listener: ", error);
            if (error instanceof Error) throw error;
            throw new Error("Failed setting up location listener");
        }
    },
});

export const HikeRepo = HikeRepository(db);

