import { Hike, IHike } from "@/src/core/models/Hike/interfaces/Hike.types";
import { HikeRepo } from "@/src/core/models/Hike/repositories/HikeRepository";
import { newHike } from "@/src/core/models/Hike/utils/HikeFactory";
import { Location, newLocation } from "@/src/core/models/Location/Location";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { logger } from "@/src/core/utility/errorFormatter";
import { Unsubscribe } from "firebase/auth";
import { StateCreator } from "zustand";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const toRad = (val: number) => (val * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
}

export interface HikeState {
    hikes: Hike[];
    isLoading: boolean;
    error: string | null;
    gpsError: string | null;

    profile: {
        id: string,
        firstname: string,
        lastname: string,
    } | null;

    currentHike: Hike | null;
    elapsedTime: number;
    timerStartTime: number;

    currentLocation: Location | null;

    totalDistance: number;
    totalElevationGain: number;

    active: boolean;
    coordinates: Location[];
    walkedRoute: [number, number][][];
    isSegmentFirstPoint?: boolean;
    live: boolean;
    activeGroupId: string | null;

    locationByGroup: Record<string, Location[]>;
    activeListeners: Record<string, Unsubscribe>;
    shareLocationEnabled: boolean;

    getLastKnownCoordinate: () => Location | null;
    addCoordinate: (coordinate: Location) => void;
    clearWalkedRoute: () => void;
    startNewSegment: () => void;
    updateCurrentHike: (patch: Partial<Hike>) => void;
    updateHikeStore: (patch: Partial<HikeState>) => void;

    fetchAll: (userId: string) => Promise<void>;
    refresh: (userId: string) => Promise<void>;
    load: (id: string, userId: string) => Promise<Hike | null>;
    create: (userId: string, hike?: Hike) => Promise<void>;
    remove: (id: string, userId: string) => Promise<void>;
    startHike: (hike: IHike, profile: { id: string, firstname: string, lastname: string }) => Promise<void>;

    startShareLocation: (groupId: string) => Promise<void>;
    stopShareLocation: (groupId: string) => void;
    setShareLocationEnabled: (enabled: boolean) => Promise<void>;

    reset: () => void;
}

export const hikeStoreCreator: StateCreator<HikeState, [["zustand/immer", never]]> = (set, get) => ({
    hikes: [],
    isLoading: false,
    error: null,
    gpsError: null,
    currentHike: null,
    elapsedTime: 0,
    timerStartTime: 0,
    totalDistance: 0,
    totalElevationGain: 0,
    active: false,
    coordinates: [],
    walkedRoute: [],
    isSegmentFirstPoint: true,
    live: false,
    locationByGroup: {},
    activeListeners: {},
    activeGroupId: null,
    shareLocationEnabled: true,
    profile: null,

    clearWalkedRoute: () => set({ walkedRoute: [], isSegmentFirstPoint: true }),
    startNewSegment: () => set((state) => {
        if (!state.walkedRoute) state.walkedRoute = [];
        const lastSeg = state.walkedRoute[state.walkedRoute.length - 1];
        if (!lastSeg || lastSeg.length > 0) {
            state.walkedRoute.push([]);
        }
        state.isSegmentFirstPoint = true;
    }),
    currentLocation: null,

    reset: () => {
        const listeners = get().activeListeners || {};
        Object.values(listeners).forEach((unsub) => {
            if (typeof unsub === "function") unsub();
        });

        set({
            hikes: [],
            isLoading: false,
            error: null,
            gpsError: null,
            currentHike: null,
            elapsedTime: 0,
            timerStartTime: 0,
            totalDistance: 0,
            totalElevationGain: 0,
            active: false,
            coordinates: [],
            walkedRoute: [],
            isSegmentFirstPoint: true,
            live: false,
            locationByGroup: {},
            activeListeners: {},
            activeGroupId: null,
            shareLocationEnabled: true,
            profile: null,
            currentLocation: null,
        });
    },


    addCoordinate: async (coordinate: Location) => {
        try {
            const currentHike = get().currentHike;
            const activeGroupId = get().activeGroupId;
            const active = get().active;
            const profile = get().profile;

            set({ currentLocation: coordinate });

            logger('HikeStoreCreator', 'Current Location', coordinate);
            // Reject invalid coordinates and Null Island
            if (
                !coordinate ||
                typeof coordinate.latitude !== 'number' ||
                typeof coordinate.longitude !== 'number' ||
                isNaN(coordinate.latitude) ||
                isNaN(coordinate.longitude) ||
                (coordinate.latitude === 0 && coordinate.longitude === 0) ||
                coordinate.latitude < -90 || coordinate.latitude > 90 ||
                coordinate.longitude < -180 || coordinate.longitude > 180
            ) {
                return;
            }

            // Only record session trail and calculate distance when hike is actively started
            if (!active || !currentHike || currentHike.status !== 'started') {
                return;
            }

            if (!profile) {
                console.warn("[addCoordinate] Skipped: No user profile found.");
                return;
            }

            set((state) => {
                if (state.currentHike && state.active && state.currentHike.status === 'started') {
                    if (!state.coordinates) state.coordinates = [];
                    if (!state.walkedRoute || state.walkedRoute.length === 0) {
                        state.walkedRoute = [[]];
                    }

                    let currentSegment = state.walkedRoute[state.walkedRoute.length - 1];
                    if (!currentSegment) {
                        currentSegment = [];
                        state.walkedRoute.push(currentSegment);
                    }

                    // If this coordinate is the first point of a new segment (after start or resume),
                    // skip displacement calculation so pause distance is not counted
                    if (state.isSegmentFirstPoint) {
                        state.isSegmentFirstPoint = false;
                    } else {
                        const lastCoord = state.coordinates[state.coordinates.length - 1];

                        if (lastCoord && typeof lastCoord.latitude === 'number' && typeof lastCoord.longitude === 'number') {
                            const distMeters = calculateDistance(lastCoord.latitude, lastCoord.longitude, coordinate.latitude, coordinate.longitude);

                            // Ignore sub-meter jitter (< 1m) and impossible GPS jumps (> 250m per tick)
                            if (distMeters > 1 && distMeters < 250) {
                                state.totalDistance += distMeters;
                            }

                            const altDiff = (coordinate.altitude || 0) - (lastCoord.altitude || 0);
                            if (altDiff > 2 && altDiff < 100) {
                                state.totalElevationGain += altDiff;
                            }
                        }
                    }

                    // Append to session telemetry & active segment
                    state.coordinates.push(coordinate);
                    currentSegment.push([coordinate.longitude, coordinate.latitude]);
                }
            });

            // Live SAR group pin sharing (only 1 merged document per active group member)
            if (get().live && get().shareLocationEnabled && activeGroupId) {
                try {
                    const name = profile ? `${profile.firstname} ${profile.lastname || ''}`.trim() : 'Anonymous Hiker';
                    const coordinateWithHikerName = newLocation({
                        ...coordinate,
                        hikerName: name
                    });
                    await HikeRepo.shareLocation(profile.id, activeGroupId, coordinateWithHikerName);
                } catch (shareError) {
                    console.error('[addCoordinate] Background location share failed:', shareError);
                }
            }
        } catch (error) {
            console.error('[addCoordinate] Unexpected error:', error);
        }
    },

    startShareLocation: async (groupId: string) => {
        try {
            const activeListeners = get().activeListeners;
            if (activeListeners[groupId]) return;
            if (!get().currentHike) throw new Error("No active hike to share location for");
            if (get().live) return;

            const profile = get().profile;
            if (!profile) throw new Error("User profile not found.");

            if (get().shareLocationEnabled) {
                const name = profile ? `${profile.firstname} ${profile.lastname || ''}`.trim() : 'Anonymous Hiker';
                const lastCoordinate = get().getLastKnownCoordinate() || newLocation();
                const coordinateWithHikerName = newLocation({
                    ...lastCoordinate,
                    hikerName: name
                });
                await HikeRepo.shareLocation(profile.id, groupId, coordinateWithHikerName);
            }

            const unsubscribe = HikeRepo.listenToLocations(
                groupId,
                (locations) => set((state) => ({
                    locationByGroup: { ...state.locationByGroup, [groupId]: locations }
                }))
            );

            set((state) => ({
                activeGroupId: groupId,
                live: true,
                activeListeners: { ...state.activeListeners, [groupId]: unsubscribe }
            }));
        } catch (error) {
            console.error('Error sharing location: ', error);
            throw error;
        }
    },

    stopShareLocation: (groupId: string) => {
        try {
            const profile = get().profile;
            if (profile?.id) {
                HikeRepo.deleteLocation(profile.id, groupId).catch((error) => {
                    console.error('Error deleting location on stopShareLocation: ', error);
                });
            }

            const unsubscribe = get().activeListeners[groupId];
            if (unsubscribe) {
                unsubscribe();
                set((state) => {
                    const newListeners = { ...state.activeListeners };
                    delete newListeners[groupId];
                    const newLocations = { ...state.locationByGroup };
                    delete newLocations[groupId];
                    return {
                        ...state,
                        activeListeners: newListeners,
                        locationByGroup: newLocations,
                        live: false,
                        activeGroupId: null,
                    };
                });
            }
        } catch (error) {
            console.error('Error stopping location sharing: ', error);
            throw error;
        }
    },

    setShareLocationEnabled: async (enabled: boolean) => {
        set({ shareLocationEnabled: enabled });

        const activeGroupId = get().activeGroupId;
        const profile = get().profile;
        if (!profile?.id || !activeGroupId) return;

        if (!enabled) {
            await HikeRepo.deleteLocation(profile.id, activeGroupId);
        } else {
            const lastCoordinate = get().getLastKnownCoordinate();
            if (lastCoordinate) {
                const name = profile ? `${profile.firstname} ${profile.lastname || ''}`.trim() : 'Anonymous Hiker';
                const coordinateWithHikerName = newLocation({
                    ...lastCoordinate,
                    hikerName: name
                });
                await HikeRepo.shareLocation(profile.id, activeGroupId, coordinateWithHikerName);
            }
        }
    },

    getLastKnownCoordinate: (): Location | null => {
        const coordinates = get().coordinates;
        if (!coordinates || coordinates.length === 0) return null;
        return coordinates[coordinates.length - 1];
    },

    updateCurrentHike: (patch) => set((state) => {
        if (state.currentHike) {
            const wasPaused = state.currentHike.status === 'paused';
            Object.assign(state.currentHike, patch);
            if (wasPaused && patch.status === 'started') {
                if (!state.walkedRoute) state.walkedRoute = [];
                const lastSeg = state.walkedRoute[state.walkedRoute.length - 1];
                if (!lastSeg || lastSeg.length > 0) {
                    state.walkedRoute.push([]);
                }
                state.isSegmentFirstPoint = true;
            }
        }
    }),

    startHike: async (hike: IHike, profile: { id: string, firstname: string, lastname: string }) => {
        set({ isLoading: true });
        try {
            const active = newHike({
                ...hike,
                status: 'started',
                startTime: new Date(),
            });

            const updated = await HikeRepo.write(active, profile.id);

            set({
                currentHike: updated,
                coordinates: [],
                walkedRoute: [],
                isSegmentFirstPoint: true,
                active: true,
                elapsedTime: 0,
                timerStartTime: Date.now(),
                totalDistance: 0,
                totalElevationGain: 0,
                profile,
            });
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateHikeStore: (patch) => set((state) => {
        Object.assign(state, patch);
    }),

    fetchAll: async (userId: string) => {
        if (get().hikes.length > 0) return;
        set({ isLoading: true, error: null });
        try {
            const hikes = await HikeRepo.fetchAll(userId);
            set({ hikes, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message || "Failed to fetch hikes", isLoading: false });
        }
    },

    refresh: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const hikes = await HikeRepo.fetchAll(userId);
            set({ hikes, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message || "Failed to refresh hikes", isLoading: false });
        }
    },

    load: async (id: string, userId: string): Promise<Hike | null> => {
        set({ isLoading: true, error: null });
        try {
            let hike = null;
            if (get().hikes.some(h => h.id === id)) {
                hike = get().hikes.find(h => h.id === id);
            }
            if (!hike) {
                hike = await HikeRepo.fetchById(userId, id);
            }
            if (!hike) throw new Error('Hike not found');
            set({ isLoading: false });
            return hike;
        } catch (error) {
            set({ error: (error as Error).message || "Failed to load hike", isLoading: false });
            return null;
        }
    },

    create: async (userId: string, hike?: Hike): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
            if (!userId) throw new Error("User ID is required to create hike");

            const baseHike = get().currentHike || hike;

            if (!baseHike) throw new Error("No hike data provided to create");

            const toUploadHike: Hike = {
                ...baseHike,
                distance: get().totalDistance,
                elevation: get().totalElevationGain,
                duration: get().elapsedTime
            };

            const response = await HikeRepo.write(toUploadHike, userId);

            // Consolidated route persistence: save the completed trail in a single document
            const route = get().walkedRoute;
            if (route && route.length > 0) {
                try {
                    await HikeRepo.writeRoute(userId, response.id, route);
                } catch (routeError) {
                    set({
                        error: (routeError as Error).message || "Failed to save consolidated hike route",
                    })
                }
            }

            set({
                isLoading: false,
                currentHike: response,
                hikes: upsertItem(get().hikes, response)
            })
        } catch (error) {
            console.error(error);
            set({ error: "Failed to create hike", isLoading: false });
        }
    },

    remove: async (id: string, userId: string): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            await HikeRepo.delete(id, userId);

            set((state) => {
                const index = state.hikes.findIndex(h => h.id === id);
                if (index !== -1) {
                    state.hikes.splice(index, 1);
                }
                state.isLoading = false;
            });
        } catch (error) {
            console.error(error);
            set({ error: "Failed to remove hike", isLoading: false });
        }
    },
});