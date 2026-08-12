import { Hike } from "@/src/core/models/Hike/Hike";
import { Location } from "@/src/core/models/Location/Location";
import { HikeRepository } from "@/src/core/repositories/hikeRepository";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
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

    currentHike: Hike | null;
    elapsedTime: number;
    timerStartTime: number;
    
    totalDistance: number;
    totalElevationGain: number;

    active: boolean;
    coordinates: Location[];
    live: boolean;
    activeGroupId: string | null;

    locationByGroup: Record<string, Location[]>;
    activeListeners: Record<string, Unsubscribe>;
    shareLocationEnabled: boolean;

    getLastKnownCoordinate: () => Location | null;
    addCoordinate: (coordinate: Location) => void;
    updateCurrentHike: (patch: Partial<Hike>) => void;  
    updateHikeStore: (patch: Partial<HikeState>) => void;

    fetchAll: (userId: string) => Promise<void>;
    refresh: (userId: string) => Promise<void>;
    load: (id: string, userId: string) => Promise<Hike | null>;
    create: (userId: string, hike?: Hike) => Promise<void>;
    remove: (id: string, userId: string) => Promise<void>;
    startHike: (userId: string) => Promise<void>;

    startShareLocation: (groupId: string) => Promise<void>;
    stopShareLocation: (groupId: string) => void;
    setShareLocationEnabled: (enabled: boolean) => Promise<void>;
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
    live: false,
    locationByGroup: {},
    activeListeners: {},
    activeGroupId: null,
    shareLocationEnabled: true,

    addCoordinate: async (coordinate: Location) => {
        try {
            const profile = useAuthStore.getState().profile;
            const currentHike = get().currentHike;
            const activeGroupId = get().activeGroupId;
            const active = get().active;

            // console.log('Adding coordinate: ', coordinate);
            if(!active || (currentHike && currentHike.status === 'paused')) {
                // console.log('not active');
                set({
                    coordinates: [coordinate]
                })
                return
            };

            if(!profile) throw new Error("Cannot save coordinates without user");
            if(!currentHike) throw new Error("Cannot save coordinates without active hike");

            set((state) => {
                if(state.currentHike && state.active && state.currentHike.status === 'started') {
                    if(!state.coordinates) state.coordinates = [];
                    
                    const lastCoord = state.coordinates[state.coordinates.length - 1];
                    
                    if (lastCoord && lastCoord.latitude && lastCoord.longitude && coordinate.latitude && coordinate.longitude) {
                        const distMeters = calculateDistance(lastCoord.latitude, lastCoord.longitude, coordinate.latitude, coordinate.longitude);
                        
                        if (distMeters > 1 && distMeters < 200) {
                            state.totalDistance += distMeters;
                        }
                        
                        const altDiff = (coordinate.altitude || 0) - (lastCoord.altitude || 0);
                        if (altDiff > 2 && altDiff < 100) { 
                            state.totalElevationGain += altDiff;
                        }
                    }
                    state.coordinates.push(coordinate);
                }
            });

            const updatedCoordinates = get().coordinates;

            if(updatedCoordinates.length % 5 === 0 && updatedCoordinates.length !== 0 && get().currentHike) {
                await HikeRepository.writeCoordinates(
                    profile.id,
                    currentHike.id,
                    updatedCoordinates
                );
                set({ coordinates: [updatedCoordinates[updatedCoordinates.length - 1]] });
            }  

            if(get().live && get().shareLocationEnabled){
                if(!activeGroupId) throw new Error('Cannot save live coordinates without active group ID');
                const name = profile ? `${profile.firstname} ${profile.lastname || ''}`.trim() : 'Anonymous Hiker';
                const coordinateWithHikerName = new Location({
                    ...coordinate,
                    hikerName: name
                });
                await HikeRepository.shareLocation(profile.id, activeGroupId, coordinateWithHikerName);
            }
        } catch (error) {
            console.error('Error adding coordinates: ', error);
            throw error;
        }
    },

    startShareLocation: async (groupId: string) => {
        try {
            const activeListeners = get().activeListeners;
            if (activeListeners[groupId]) return;
            if(!get().currentHike) throw new Error("No active hike to share location for");
            if(get().live) return;

            const profile = useAuthStore.getState().profile;
            if(!profile) throw new Error("User profile not found.");
            
            if (get().shareLocationEnabled) {
                const name = profile ? `${profile.firstname} ${profile.lastname || ''}`.trim() : 'Anonymous Hiker';
                const lastCoordinate = get().getLastKnownCoordinate() || new Location();
                const coordinateWithHikerName = new Location({
                    ...lastCoordinate,
                    hikerName: name
                });
                await HikeRepository.shareLocation(profile.id, groupId, coordinateWithHikerName);
            }

            const unsubscribe = HikeRepository.listenToLocations(
                groupId, 
                (locations) => set((state) => ({
                    locationByGroup: { ...state.locationByGroup, [groupId]: locations }
                }))
            );

            set((state) => ({
                activeGroupId: groupId, 
                live: true,
                activeListeners: { ...state.activeListeners, [groupId]: unsubscribe }
            }))
        } catch (error) {
            console.error('Error sharing location: ', error);
            throw error;
        }
    },

    stopShareLocation: (groupId: string) => {
        try {
            const profile = useAuthStore.getState().profile;
            if (profile?.id) {
                HikeRepository.deleteLocation(profile.id, groupId).catch((error) => {
                    console.error('Error deleting location on stopShareLocation: ', error);
                });
            }

            const unsubscribe = get().activeListeners[groupId];
            if(unsubscribe) {
                unsubscribe();
                set((state) => {
                    const newListeners = { ...state.activeListeners };
                    delete newListeners[groupId];
                    return { ...state, activeListeners: newListeners, live: false, activeGroupId: null }
                })
            }
        } catch (error) {
            console.error('Error stopping location sharing: ', error);
            throw error;
        }
    },

    setShareLocationEnabled: async (enabled: boolean) => {
        set({ shareLocationEnabled: enabled });
        
        const activeGroupId = get().activeGroupId;
        const profile = useAuthStore.getState().profile;
        if (!profile?.id || !activeGroupId) return;

        if (!enabled) {
            // Immediately remove coordinate from DB
            await HikeRepository.deleteLocation(profile.id, activeGroupId);
        } else {
            // Immediately publish last known location
            const lastCoordinate = get().getLastKnownCoordinate();
            if (lastCoordinate) {
                const name = profile ? `${profile.firstname} ${profile.lastname || ''}`.trim() : 'Anonymous Hiker';
                const coordinateWithHikerName = new Location({
                    ...lastCoordinate,
                    hikerName: name
                });
                await HikeRepository.shareLocation(profile.id, activeGroupId, coordinateWithHikerName);
            }
        }
    },

    getLastKnownCoordinate: (): Location | null  => {
        const coordinates = get().coordinates
        if(!coordinates || coordinates.length === 0) return null;
        return coordinates[coordinates.length - 1];
    },
    
    updateCurrentHike: (patch) => set((state) => {
        if(state.currentHike) { Object.assign(state.currentHike, patch); }
    }),

    startHike: async (userId: string) => {
        set({isLoading: true});
        try {
            const hike = get().currentHike;
            if(!hike) throw new Error("No hike loaded to start");

            const active = new Hike({
                ...hike,
                status: 'started',
                startTime: new Date(),
            })

            console.log('writing:', active);

            console.log(typeof active.startTime);
            console.log(typeof active.hikeDate);

            const updated = await HikeRepository.write(active, userId);
            
            set({
                currentHike: updated,
                coordinates: [],
                active: true,
                elapsedTime: 0,
                timerStartTime: Date.now(),
                totalDistance: 0, 
                totalElevationGain: 0, 
            })
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            set({ isLoading: false })
        }
    },

    updateHikeStore: (patch) => set((state) => {    
        Object.assign(state, patch);
    }),

    fetchAll: async (userId: string) => {
        if(get().hikes.length > 0) return;
        set({isLoading: true, error: null});
        try {
            const hikes = await HikeRepository.fetchAll(userId);
            set({hikes, isLoading: false});
        } catch (error) {
            set({error: "Failed to fetch hikes", isLoading: false});
        }
    },

    refresh: async (userId: string) => {
        set({isLoading: true, error: null});
        try {
            const hikes = await HikeRepository.fetchAll(userId);
            set({hikes, isLoading: false});
        } catch (error) {
            set({error: "Failed to refresh hikes", isLoading: false});
        }
    },

    load: async (id: string, userId: string): Promise<Hike | null> => {
        set({isLoading: true, error: null});
        try {
            let hike = null;
            if(get().hikes.some(h => h.id === id)) {
                hike = get().hikes.find(h => h.id === id);
            }
            if(!hike) {
                hike = await HikeRepository.fetchById(userId, id);
            }
            if(!hike) throw new Error('Hike not found');
            set({isLoading: false});
            return hike;
        } catch (error) {
            set({error: "Failed to load hike", isLoading: false});
            return null;
        }
    },

    create: async (userId: string, hike?: Hike): Promise<void> => {
        set({isLoading: true, error: null});
        try {
            if(!userId) throw new Error("User ID is required to create hike");

            const toUploadHike = get().currentHike ?? hike;
            if(!toUploadHike) throw new Error("No hike data provided to create");

            const response = await HikeRepository.write(toUploadHike, userId);
            
            set((state) => {
                const index = state.hikes.findIndex(h => h.id === response.id);
                if(index !== -1){ state.hikes[index] = response; } 
                else { state.hikes.push(response); }
                state.isLoading = false;
            });
        } catch (error) {
            console.error(error);
            set({error: "Failed to create hike", isLoading: false});
        }
    },

    remove: async (id: string, userId: string): Promise<void> => {
        set({isLoading: true, error: null});

        try {
            await HikeRepository.delete(id, userId);

            set((state) => {   
                const index = state.hikes.findIndex(h => h.id === id);  
                if(index !== -1) {
                    state.hikes.splice(index, 1);
                }
                state.isLoading = false;
            });
        } catch (error) {
            console.error(error);
            set({error: "Failed to remove hike", isLoading: false});
        }
    },
})