import { db } from "@/src/core/config/Firebase";
import { Location, WriteLocation } from "@/src/core/models/Location/interfaces/Location.types";
import { locationConverter } from "@/src/core/models/Location/utils/LocationFactory";
import {
    collection,
    doc,
    Firestore,
    getDocs,
    onSnapshot,
    setDoc,
    Unsubscribe,
} from "firebase/firestore";

export const LocationRepository = (db: Firestore) => {
    const createLiveLocationsCollection = (groupId: string) => {
        return collection(db, "groups", groupId, "liveLocations").withConverter(locationConverter);
    };

    return {
        /**
         * Listens to real-time location updates for all active hikers in a group.
         */
        listenToLocations(groupId: string, onUpdate: (locations: Location[]) => void): Unsubscribe {
            try {
                const colRef = createLiveLocationsCollection(groupId);

                return onSnapshot(
                    colRef,
                    (snapshot) => {
                        onUpdate(snapshot.docs.map((docSnap) => docSnap.data()));
                    },
                    (error) => {
                        console.error("Error in listenToLocations: ", error);
                    }
                );
            } catch (error) {
                console.error("Failed to listen to group locations:", error);
                throw error;
            }
        },

        /**
         * Alias for listenToLocations.
         */
        listenToGroupLocations(groupId: string, onUpdate: (locations: Location[]) => void): Unsubscribe {
            return this.listenToLocations(groupId, onUpdate);
        },

        /**
         * Fetches current snapshot of live locations for a group.
         */
        async fetchGroupLocations(groupId: string): Promise<Location[]> {
            try {
                const colRef = createLiveLocationsCollection(groupId);
                const snapshot = await getDocs(colRef);
                return snapshot.docs.map((docSnap) => docSnap.data());
            } catch (error) {
                console.error("Failed to fetch group locations:", error);
                throw error;
            }
        },

        /**
         * Sends live coordinate updates for a user to a group's live locations subcollection.
         */
        async liveFeedLocation(params: WriteLocation): Promise<void> {
            const { groupId, userId, location } = params;

            try {
                if (!groupId || !userId) {
                    throw new Error("Missing required parameters: groupId and userId");
                }

                if (!location || location.latitude === undefined || location.longitude === undefined) {
                    throw new Error("Invalid location data: latitude and longitude are required");
                }

                const docRef = doc(db, "groups", groupId, "liveLocations", userId).withConverter(locationConverter);

                await setDoc(docRef, location, { merge: true });
            } catch (error) {
                console.error("LocationRepository liveFeedLocation error:", error);
                throw error;
            }
        },

        /**
         * Saves or updates a user's current location directly.
         */
        async writeLocation(params: Omit<WriteLocation, "groupId">): Promise<void> {
            const { userId, location } = params;

            try {
                if (!userId || !location) {
                    throw new Error("Missing required parameters: userId and location");
                }

                const docRef = doc(db, "users", userId, "location", "current").withConverter(locationConverter);
                await setDoc(docRef, location, { merge: true });
            } catch (error) {
                console.error("LocationRepository writeLocation error:", error);
                throw error;
            }
        },
    };
};

export const LocationRepo = LocationRepository(db);
