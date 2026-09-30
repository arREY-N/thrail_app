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
     * Writes the complete consolidated route for a hike to Firestore.
     * Stored in a single document: users/{userId}/hikes/{hikeId}/route/session
     * @param userId - The ID of the user.
     * @param hikeId - The ID of the hike.
     * @param route - Complete array of [lon, lat] coordinates.
     */
    async writeRoute(userId: string, hikeId: string, route: [number, number][]): Promise<void> {
        try {
            if (!route || route.length === 0) return;
            const routeRef = doc(db, "users", userId, "hikes", hikeId, "route", "session");
            await setDoc(routeRef, {
                coordinates: route,
                pointCount: route.length,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error("Error writing consolidated hike route: ", error);
            if (error instanceof Error) throw error;
            throw new Error("Failed writing hike route");
        }
    },

    /**
     * Fetches the consolidated route for a completed hike.
     * @param userId - The ID of the user.
     * @param hikeId - The ID of the hike.
     * @returns Array of [lon, lat] coordinates or empty array.
     */
    async fetchRoute(userId: string, hikeId: string): Promise<[number, number][]> {
        try {
            const routeRef = doc(db, "users", userId, "hikes", hikeId, "route", "session");
            const snapshot = await getDoc(routeRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                return (data.coordinates as [number, number][]) || [];
            }
            return [];
        } catch (error) {
            console.error("Error fetching hike route: ", error);
            return [];
        }
    },

    /**
     * Legacy coordinate writer - preserved for backwards compatibility.
     * Converts Location[] to [lon, lat][] and persists via writeRoute.
     */
    async writeCoordinates(userId: string, hikeId: string, coordinates: Location[]): Promise<void> {
        try {
            if (!coordinates || coordinates.length === 0) return;
            const route: [number, number][] = coordinates
                .filter(c => typeof c.longitude === 'number' && typeof c.latitude === 'number' && !isNaN(c.longitude) && !isNaN(c.latitude))
                .map(c => [c.longitude, c.latitude]);
            if (route.length > 0) {
                const routeRef = doc(db, "users", userId, "hikes", hikeId, "route", "session");
                await setDoc(routeRef, {
                    coordinates: route,
                    pointCount: route.length,
                    updatedAt: Timestamp.now(),
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error in writeCoordinates: ", error);
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
                    const locations = snapshot.docs.map(docsnap => ({
                        ...docsnap.data(),
                        id: docsnap.id,
                    }));
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

