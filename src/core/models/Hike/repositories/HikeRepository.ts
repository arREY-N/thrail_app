import { db } from "@/src/core/config/Firebase";
import { Hike } from "@/src/core/models/Hike/interfaces/Hike.types";
import { hikeConverter } from "@/src/core/models/Hike/utils/HikeFactory";
import { Location, locationConverter } from "@/src/core/models/Location/Location";
import { IUserSummary, User } from "@/src/core/models/User/User";
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
     * Fetches all hikes across multiple users from Firestore.
     * Enriches each hike with user summary details if missing.
     * @param users - Array of user objects or user IDs.
     * @returns Promise<Hike[]>
     */
    async fetchAllFromUsers(users: (User | IUserSummary | string)[]): Promise<Hike[]> {
        try {
            const fetchPromises = users.map(async (u) => {
                const userId = typeof u === 'string' ? u : u.id;
                if (!userId) return [];
                try {
                    const userHikes = await this.fetchAll(userId);
                    return userHikes.map((h) => ({
                        ...h,
                        trail: {
                            id: h.trail?.id || "diy",
                            name: h.trail?.name || "DIY Hike / Custom Route",
                            location: h.trail?.location || "",
                        },
                        user: h.user?.id ? h.user : {
                            id: userId,
                            username: typeof u !== 'string' ? u.username || '' : '',
                            firstname: typeof u !== 'string' ? u.firstname || '' : '',
                            lastname: typeof u !== 'string' ? u.lastname || '' : '',
                            email: typeof u !== 'string' ? u.email || '' : '',
                        },
                    }));
                } catch (err) {
                    console.warn(`Could not fetch hikes for user ${userId}:`, err);
                    return [];
                }
            });

            const results = await Promise.all(fetchPromises);
            return results.flat();
        } catch (err) {
            console.error("Error fetching all users' hikes:", err);
            if (err instanceof Error) throw err;
            throw new Error("Failed fetching all users' hikes");
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
     * Note: Firestore strictly forbids nested arrays (e.g. [[lon, lat]]).
     * Coordinates are structured as map objects { lon, lat } and full GeoJSON string.
     * @param userId - The ID of the user.
     * @param hikeId - The ID of the hike.
     * @param route - Route coordinates as [lon, lat][] or segments [lon, lat][][].
     */
    async writeRoute(userId: string, hikeId: string, route: [number, number][] | [number, number][][]): Promise<void> {
        try {
            if (!route || route.length === 0) return;

            let segments: [number, number][][] = [];
            let flatCoordinates: [number, number][] = [];

            // Detect whether route is multi-segment ([lon, lat][][]) or legacy flat ([lon, lat][])
            if (typeof route[0]?.[0] === 'number') {
                // Flat [lon, lat][]
                flatCoordinates = route as [number, number][];
                segments = [flatCoordinates];
            } else {
                // Multi-segment [lon, lat][][]
                segments = (route as [number, number][][]).filter(seg => Array.isArray(seg) && seg.length > 0);
                flatCoordinates = segments.flat();
            }

            if (flatCoordinates.length === 0) return;

            // Transform into Firestore-compatible structures (NO nested arrays!)
            const structuredSegments = segments.map((seg, idx) => ({
                index: idx,
                points: seg.map(([lon, lat]) => ({ lon, lat })),
            }));
            const structuredCoordinates = flatCoordinates.map(([lon, lat]) => ({ lon, lat }));
            const geoJsonString = JSON.stringify({
                type: "MultiLineString",
                coordinates: segments,
            });

            const payload = {
                segments: structuredSegments,
                coordinates: structuredCoordinates,
                geoJson: geoJsonString,
                pointCount: flatCoordinates.length,
                segmentCount: segments.length,
                updatedAt: Timestamp.now(),
            };

            // 1. Primary write to coordinates/session:
            // Explicitly authorized by deployed Firestore security rules (match /coordinates/{coordinateId})
            const coordinatesRef = doc(db, "users", userId, "hikes", hikeId, "coordinates", "session");
            await setDoc(coordinatesRef, payload);

            // 2. Secondary write to route/session (if route subcollection rule is active/deployed)
            try {
                const routeRef = doc(db, "users", userId, "hikes", hikeId, "route", "session");
                await setDoc(routeRef, payload);
            } catch {
                // Non-critical: coordinates/session is already securely persisted
            }
        } catch (error) {
            console.error("Error writing consolidated hike route: ", error);
            if (error instanceof Error) throw error;
            throw new Error("Failed writing hike route");
        }
    },

    /**
     * Fetches the consolidated route for a completed hike.
     * Checks coordinates/session first, then falls back to route/session.
     * Returns segments if available, otherwise wraps legacy coordinates in a single segment.
     * @param userId - The ID of the user.
     * @param hikeId - The ID of the hike.
     * @returns Array of segments ([lon, lat][][]) or empty array.
     */
    async fetchRoute(userId: string, hikeId: string): Promise<[number, number][][]> {
        try {
            // Check coordinates/session first (primary), then fallback to route/session
            let snapshot = null;
            try {
                const coordinatesRef = doc(db, "users", userId, "hikes", hikeId, "coordinates", "session");
                const coordSnap = await getDoc(coordinatesRef);
                if (coordSnap.exists()) {
                    snapshot = coordSnap;
                }
            } catch {
                // Ignore and try fallback
            }

            if (!snapshot) {
                const routeRef = doc(db, "users", userId, "hikes", hikeId, "route", "session");
                const routeSnap = await getDoc(routeRef);
                if (routeSnap.exists()) {
                    snapshot = routeSnap;
                }
            }

            if (snapshot && snapshot.exists()) {
                const data = snapshot.data();
                // 1. Prefer GeoJSON string
                if (data.geoJson && typeof data.geoJson === 'string') {
                    try {
                        const parsed = JSON.parse(data.geoJson);
                        if (parsed.type === "MultiLineString" && Array.isArray(parsed.coordinates)) {
                            return parsed.coordinates as [number, number][][];
                        }
                    } catch {
                        // ignore and try next format
                    }
                }
                // 2. Structured segments: Array<{ index: number, points: Array<{ lon: number, lat: number }> }>
                if (data.segments && Array.isArray(data.segments)) {
                    if (data.segments.length > 0 && data.segments[0]?.points) {
                        return data.segments.map((seg: { points?: { lon: number; lat: number }[] }) =>
                            (seg.points || []).map(p => [p.lon, p.lat] as [number, number])
                        );
                    }
                    if (Array.isArray(data.segments[0]) && Array.isArray(data.segments[0][0])) {
                        return data.segments as [number, number][][];
                    }
                }
                // 3. Structured coordinates: Array<{ lon: number, lat: number }>
                if (data.coordinates && Array.isArray(data.coordinates)) {
                    const coords = (data.coordinates as unknown[]).map((p) => {
                        if (Array.isArray(p)) {
                            return typeof p[0] === 'number' && typeof p[1] === 'number'
                                ? ([p[0], p[1]] as [number, number])
                                : null;
                        }
                        if (p && typeof p === 'object') {
                            const point = p as { lon?: unknown; lat?: unknown; longitude?: unknown; latitude?: unknown };
                            const lon = typeof point.lon === 'number' ? point.lon : typeof point.longitude === 'number' ? point.longitude : null;
                            const lat = typeof point.lat === 'number' ? point.lat : typeof point.latitude === 'number' ? point.latitude : null;
                            if (lon !== null && lat !== null) {
                                return [lon, lat] as [number, number];
                            }
                        }
                        return null;
                    }).filter((c): c is [number, number] => c !== null);
                    return coords.length > 0 ? [coords] : [];
                }
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
                await this.writeRoute(userId, hikeId, route);
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
            if (!userId || !groupId || groupId === 'new_diy_session' || groupId === 'diy') {
                return;
            }
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
            if (!userId || !groupId || groupId === 'new_diy_session' || groupId === 'diy') {
                return;
            }
            const locationRef = doc(collection(db, "groups", groupId, "liveLocations"), userId);
            await deleteDoc(locationRef);
        } catch (error) {
            console.warn("Could not delete group location pin (safe to ignore if session reset): ", error);
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

