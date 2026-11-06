import { Hike, IHike } from "@/src/core/models/Hike/interfaces/Hike.types";
import { HikeRepo } from "@/src/core/models/Hike/repositories/HikeRepository";
import { newHike } from "@/src/core/models/Hike/utils/HikeFactory";
import { Location, newLocation } from "@/src/core/models/Location/Location";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { logger } from "@/src/core/utility/errorFormatter";
import {
    applyBreadcrumbPipeline,
    haversineMeters,
    sharedGpsKalmanFilter,
    simplifyMultiLineRouteRDP,
    simplifyPolylineRDP,
} from "@/src/core/utility/gps";
import { saveLocalTrackPoint } from "@/src/core/utility/hikeStorage";
import { Unsubscribe } from "firebase/auth";
import { StateCreator } from "zustand";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    return haversineMeters(lat1, lon1, lat2, lon2);
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
    totalElevationLoss: number;
    elevationBaseline: number | null;

    active: boolean;
    coordinates: Location[];
    walkedRoute: [number, number][][];
    isSegmentFirstPoint?: boolean;
    live: boolean;
    activeGroupId: string | null;
    lastShareTime?: number;
    lastShareCoord?: { latitude: number; longitude: number } | null;

    locationByGroup: Record<string, Location[]>;
    activeListeners: Record<string, Unsubscribe | undefined>;
    shareLocationEnabled: boolean;

    getLastKnownCoordinate: () => Location | null;
    addCoordinate: (coordinate: Location) => void;
    setCurrentLocation: (location: Location | null) => void;
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

    events: {
        id: string;
        type: 'GPS_SIGNAL_LOST' | 'GPS_SIGNAL_RESTORED' | 'APP_BACKGROUNDED' | 'APP_RESUMED' | 'HIKE_PAUSED' | 'HIKE_RESUMED';
        timestamp: string;
        latitude?: number;
        longitude?: number;
        altitude?: number;
        synced?: boolean;
    }[];
    logHikeEvent: (type: 'GPS_SIGNAL_LOST' | 'GPS_SIGNAL_RESTORED' | 'APP_BACKGROUNDED' | 'APP_RESUMED' | 'HIKE_PAUSED' | 'HIKE_RESUMED', coords?: { latitude?: number; longitude?: number; altitude?: number }) => void;
    syncOfflineData: () => Promise<void>;

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
    totalElevationLoss: 0,
    elevationBaseline: null,
    active: false,
    coordinates: [],
    walkedRoute: [],
    isSegmentFirstPoint: true,
    live: false,
    locationByGroup: {},
    activeListeners: {},
    activeGroupId: null,
    lastShareTime: 0,
    lastShareCoord: null,
    shareLocationEnabled: true,
    profile: null,
    events: [],

    clearWalkedRoute: () => set({ walkedRoute: [], isSegmentFirstPoint: true, elevationBaseline: null }),
    startNewSegment: () => set((state) => {
        if (!state.walkedRoute) state.walkedRoute = [];
        const lastSeg = state.walkedRoute[state.walkedRoute.length - 1];
        if (!lastSeg || lastSeg.length > 0) {
            state.walkedRoute.push([]);
        }
        state.isSegmentFirstPoint = true;
        state.elevationBaseline = null;
    }),
    currentLocation: null,
    setCurrentLocation: (location: Location | null) => {
        if (!location) {
            set({ currentLocation: null });
            return;
        }

        // Validate coordinate bounds and reject Null Island
        if (
            typeof location.latitude !== 'number' ||
            typeof location.longitude !== 'number' ||
            isNaN(location.latitude) ||
            isNaN(location.longitude) ||
            (location.latitude === 0 && location.longitude === 0) ||
            location.latitude < -90 || location.latitude > 90 ||
            location.longitude < -180 || location.longitude > 180
        ) {
            return;
        }

        set({ currentLocation: location });
    },

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
            totalElevationLoss: 0,
            elevationBaseline: null,
            active: false,
            coordinates: [],
            walkedRoute: [],
            isSegmentFirstPoint: true,
            live: false,
            locationByGroup: {},
            activeListeners: {},
            activeGroupId: null,
            lastShareTime: 0,
            lastShareCoord: null,
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

            set({ currentLocation: coordinate });
            logger('HikeStoreCreator', 'Current Location', coordinate);

            // 1. Session route drawing & distance (STRICTLY started hikes only)
            let isCommitted = false;
            if (active && currentHike && currentHike.status === 'started') {
                set((state) => {
                    if (state.currentHike && state.active && state.currentHike.status === 'started') {
                        if (!state.coordinates) state.coordinates = [];
                        if (!state.walkedRoute || state.walkedRoute.length === 0) {
                            state.walkedRoute = [[]];
                        }
                        isCommitted = applyBreadcrumbPipeline(state, coordinate);
                    }
                });

                if (isCommitted) {
                    // Persist committed points locally to CSV for crash recovery & offline export
                    const isoTime = coordinate.timestamp instanceof Date
                        ? coordinate.timestamp.toISOString()
                        : new Date(coordinate.timestamp || Date.now()).toISOString();
                    saveLocalTrackPoint(coordinate.latitude, coordinate.longitude, coordinate.altitude ?? 0, isoTime).catch(() => {});
                }
            }

            // 2. Emergency live location pin sharing with throttling (BOTH started and paused hikes)
            if (active && currentHike && (currentHike.status === 'started' || currentHike.status === 'paused')) {
                if (get().live && get().shareLocationEnabled && activeGroupId && profile?.id) {
                    const nowMs = Date.now();
                    const lastShareTime = get().lastShareTime || 0;
                    const lastShareCoord = get().lastShareCoord;

                    const timeSinceLastShare = (nowMs - lastShareTime) / 1000;
                    const distFromLastShare = lastShareCoord
                        ? calculateDistance(lastShareCoord.latitude, lastShareCoord.longitude, coordinate.latitude, coordinate.longitude)
                        : 999;

                    // Throttle: broadcast at most once every 12 seconds, OR when moved >= 10m, OR on first share
                    const shouldShare = timeSinceLastShare >= 12 || distFromLastShare >= 10 || lastShareTime === 0;

                    if (shouldShare) {
                        try {
                            const name = `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || 'Anonymous Hiker';
                            const coordinateWithHikerName = newLocation({
                                ...coordinate,
                                hikerName: name,
                            });
                            await HikeRepo.shareLocation(profile.id, activeGroupId, coordinateWithHikerName);
                            // Update lastShareTime only after successful transmission so offline failures don't lock out immediate retry
                            set({
                                lastShareTime: Date.now(),
                                lastShareCoord: { latitude: coordinate.latitude, longitude: coordinate.longitude },
                            });
                        } catch (shareError) {
                            console.warn('[addCoordinate] Live location share failed (will retry on next fix once online):', shareError);
                        }
                    }
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
                const lastCoordinate = get().getLastKnownCoordinate();
                if (
                    lastCoordinate &&
                    typeof lastCoordinate.latitude === 'number' &&
                    typeof lastCoordinate.longitude === 'number' &&
                    !isNaN(lastCoordinate.latitude) &&
                    !isNaN(lastCoordinate.longitude) &&
                    !(lastCoordinate.latitude === 0 && lastCoordinate.longitude === 0) &&
                    lastCoordinate.latitude >= -90 && lastCoordinate.latitude <= 90 &&
                    lastCoordinate.longitude >= -180 && lastCoordinate.longitude <= 180
                ) {
                    const name = profile ? `${profile.firstname} ${profile.lastname || ''}`.trim() : 'Anonymous Hiker';
                    const coordinateWithHikerName = newLocation({
                        ...lastCoordinate,
                        timestamp: new Date(),
                        hikerName: name
                    });
                    await HikeRepo.shareLocation(profile.id, groupId, coordinateWithHikerName);
                    set({
                        lastShareTime: Date.now(),
                        lastShareCoord: { latitude: lastCoordinate.latitude, longitude: lastCoordinate.longitude }
                    });
                }
            }

            const existingUnsub = get().activeListeners[groupId];
            if (existingUnsub) {
                set({ activeGroupId: groupId, live: true });
                return;
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
                    console.warn('Notice: Could not delete remote location pin on stopShareLocation: ', error);
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
                    timestamp: new Date(),
                    hikerName: name
                });
                await HikeRepo.shareLocation(profile.id, activeGroupId, coordinateWithHikerName);
                set({
                    lastShareTime: Date.now(),
                    lastShareCoord: { latitude: lastCoordinate.latitude, longitude: lastCoordinate.longitude }
                });
            }
        }
    },

    logHikeEvent: (type, coords) => {
        const timestamp = new Date().toISOString();
        const eventId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newEvent = {
            id: eventId,
            type,
            timestamp,
            latitude: coords?.latitude ?? get().currentLocation?.latitude,
            longitude: coords?.longitude ?? get().currentLocation?.longitude,
            altitude: coords?.altitude ?? get().currentLocation?.altitude,
            synced: false,
        };

        set((state) => {
            if (!state.events) state.events = [];
            state.events.push(newEvent);
        });

        saveLocalTrackPoint(
            newEvent.latitude ?? 0,
            newEvent.longitude ?? 0,
            newEvent.altitude ?? 0,
            `${timestamp},EVENT_${type}`
        ).catch(() => {});
    },

    syncOfflineData: async () => {
        const profile = get().profile;
        const currentHike = get().currentHike;
        const activeGroupId = get().activeGroupId;

        // 1. Immediately refresh live group location pin if active
        if (get().active && (currentHike?.status === 'started' || currentHike?.status === 'paused')) {
            if (get().live && get().shareLocationEnabled && activeGroupId && profile?.id) {
                const lastCoord = get().getLastKnownCoordinate();
                if (lastCoord) {
                    try {
                        const name = `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || 'Anonymous Hiker';
                        await HikeRepo.shareLocation(profile.id, activeGroupId, newLocation({
                            ...lastCoord,
                            timestamp: new Date(),
                            hikerName: name,
                        }));
                        set({
                            lastShareTime: Date.now(),
                            lastShareCoord: { latitude: lastCoord.latitude, longitude: lastCoord.longitude }
                        });
                    } catch (err) {
                        console.warn("[syncOfflineData] Live location refresh failed:", err);
                    }
                }
            }
        }

        // 2. Mark offline events as synced
        set((state) => {
            if (state.events) {
                state.events.forEach(e => { e.synced = true; });
            }
        });
    },

    getLastKnownCoordinate: (): Location | null => {
        const coordinates = get().coordinates;
        if (!coordinates || coordinates.length === 0) return get().currentLocation || null;
        return coordinates[coordinates.length - 1];
    },

    updateCurrentHike: (patch) => set((state) => {
        if (state.currentHike) {
            const wasPaused = state.currentHike.status === 'paused';
            const wasStarted = state.currentHike.status === 'started';
            Object.assign(state.currentHike, patch);

            // Tier 2 RDP Simplification when pausing an active segment
            if (wasStarted && patch.status === 'paused' && state.walkedRoute && state.walkedRoute.length > 0) {
                const lastIdx = state.walkedRoute.length - 1;
                const activeSeg = state.walkedRoute[lastIdx];
                if (activeSeg && activeSeg.length > 2) {
                    state.walkedRoute[lastIdx] = simplifyPolylineRDP(activeSeg, 1.8);
                }
            }

            if (wasPaused && patch.status === 'started') {
                if (!state.walkedRoute) state.walkedRoute = [];
                const lastSeg = state.walkedRoute[state.walkedRoute.length - 1];
                if (!lastSeg || lastSeg.length > 0) {
                    state.walkedRoute.push([]);
                }
                state.isSegmentFirstPoint = true;
                state.elevationBaseline = null;
            }
        }
    }),

    startHike: async (hike: IHike, profile: { id: string, firstname: string, lastname: string }) => {
        set({ isLoading: true });
        try {
            // Reset EKF & ZUPT state so stale pre-hike road coordinates cannot pull the newly started hike
            sharedGpsKalmanFilter.reset();

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
                elevationBaseline: null,
                active: true,
                elapsedTime: 0,
                timerStartTime: Date.now(),
                totalDistance: 0,
                totalElevationGain: 0,
                totalElevationLoss: 0,
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

            // Consolidated route persistence: apply Tier 2 RDP simplification and save in a single document
            const rawRoute = get().walkedRoute;
            const route = rawRoute && rawRoute.length > 0
                ? simplifyMultiLineRouteRDP(rawRoute, 1.8)
                : rawRoute;
            if (route && route.length > 0) {
                set({ walkedRoute: route });
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