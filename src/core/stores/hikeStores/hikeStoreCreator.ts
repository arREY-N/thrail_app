import { Hike } from "@/src/core/models/Hike/Hike";
import { Location } from "@/src/core/models/Location/Location";
import { HikeRepository } from "@/src/core/repositories/hikeRepository";
import { useAuthStore } from "@/src/core/stores/authStore";
import { Unsubscribe } from "firebase/auth";
import { StateCreator } from "zustand";

export interface HikeState {
    hikes: Hike[];
    isLoading: boolean;
    error: string | null;
    gpsError: string | null;

    currentHike: Hike | null;
    elapsedTime: number;
    timerStartTime: number;
    active: boolean;
    coordinates: Location[];
    live: boolean;
    activeGroupId: string | null;

    locationByGroup: Record<string, Location[]>;
    activeListeners: Record<string, Unsubscribe>;


    getLastKnownCoordinate: () => Location | null;
    addCoordinate: (coordinate: Location) => void;
    updateCurrentHike: (patch: Partial<Hike>) => void;  
    updateHikeStore: (patch: Partial<HikeState>) => void;

    fetchAll: (userId: string) => Promise<void>;
    refresh: (userId: string) => Promise<void>;
    load: (id: string, userId: string) => Promise<Hike | null>;
    create: (hike: Hike, userId: string) => Promise<void>;
    remove: (id: string, userId: string) => Promise<void>;
    startHike: (userId: string) => Promise<void>;

    startShareLocation: (groupId: string) => Promise<void>;
    stopShareLocation: (groupId: string) => void;
}

export const hikeStoreCreator: StateCreator<HikeState, [["zustand/immer", never]]> = (set, get) => ({
    hikes: [],
    isLoading: false,
    error: null,
    gpsError: null,
    currentHike: null,
    elapsedTime: 0,
    timerStartTime: 0,
    active: false,
    coordinates: [new Location()],
    live: false,
    locationByGroup: {},
    activeListeners: {},
    activeGroupId: null,

    addCoordinate: async (coordinate: Location) => {
        try {
            console.log('Added coordinate: ', coordinate);
            const coordinates = get().coordinates;
            const profile = useAuthStore.getState().profile;
            const currentHike = get().currentHike;
            const activeGroupId = get().activeGroupId;
            const active = get().active;

            if(!active) return;

            if(!profile) throw new Error("Cannot save coordinates without user");
            if(!currentHike) throw new Error("Cannot save coordinates without active hike");

            if(coordinates.length % 5 === 0 && coordinates.length !== 0 && get().currentHike) {
                console.log('Adding coordinate to hike after 5 new coordinates collected');
                
                console.log(
                    profile.id,
                    currentHike.id,
                    coordinates.slice(1)
                )
                await HikeRepository.writeCoordinates(
                    profile.id,
                    currentHike.id,
                    coordinates.slice(1)
                );

                set({ coordinates: [coordinates[3]] });
            }  

            if(get().live){
                if(!activeGroupId) throw new Error('Cannot save live coordinates without active group ID');
                await HikeRepository.shareLocation(profile.id, activeGroupId, coordinate);
            }

            set((state) => {
                if(state.currentHike && state.active) {
                    if(!state.coordinates){
                        state.coordinates = [];
                    }
                    state.coordinates.push(coordinate);
                }
            });
        } catch (error) {
            console.error('Error adding coordinates: ', error);
            throw error;
        }
    },

    startShareLocation: async (groupId: string) => {
        try {
            const activeListeners = get().activeListeners;
            if (activeListeners[groupId]) {
                console.log("Listener already active for this group");
                return;
            }

            if(!get().currentHike) {
                throw new Error("No active hike to share location for");
            }

            if(get().live) {
                return;
            }

            const profile = useAuthStore.getState().profile;
    
            if(!profile)
                throw new Error("User profile not found. Cannot share location.");
            
            const lastCoordinate = get().getLastKnownCoordinate();

            if(!lastCoordinate) {
                throw new Error("No coordinates to share");
            }

            await HikeRepository.shareLocation(profile.id, groupId, lastCoordinate);

            const unsubscribe = HikeRepository.listenToLocations(
                groupId, 
                (locations) => set((state) => ({
                    locationByGroup: {
                        ...state.locationByGroup,
                        [groupId]: locations
                    }
                }))
            );

            set((state) => ({
                activeGroupId: groupId, 
                live: true,
                activeListeners: {
                    ...state.activeListeners,
                    [groupId]: unsubscribe
                }
            }))
        } catch (error) {
            console.error('Error sharing location: ', error);
            throw error;
        }
    },

    stopShareLocation: (groupId: string) => {
        try {
            const unsubscribe = get().activeListeners[groupId];

            if(unsubscribe) {
                unsubscribe();
                set((state) => {
                    const newListeners = { ...state.activeListeners };
                    delete newListeners[groupId];
                    return {    
                        ...state,
                        activeListeners: newListeners,
                        live: false,
                    }
                })
            }

            console.log('unsubscribed', get().activeListeners[groupId])
        } catch (error) {
            console.error('Error stopping location sharing: ', error);
            throw error;
        }
    },

    getLastKnownCoordinate: (): Location | null  => {
        const coordinates = get().coordinates
        console.log('coordinates: ', coordinates)
        if(!coordinates || coordinates.length === 0){
            
            return null;
        }
        
        return coordinates[coordinates.length - 1];
    },
    
    updateCurrentHike: (patch) => set((state) => {
        if(state.currentHike) {
            Object.assign(state.currentHike, patch);
        }
    }),

    startHike: async (userId: string) => {
        set({isLoading: true});
        try {
            const hike = get().currentHike;
            
            if(!hike) {
                throw new Error("No hike loaded to start");
            }

            const active = new Hike({
                ...hike,
                status: 'started',
                startTime: new Date(),
            })

            const updated = await HikeRepository.write(active, userId);
            
            set({
                currentHike: updated,
                coordinates: [new Location()],
                active: true,
                elapsedTime: 0,
                timerStartTime: Date.now(),
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
            console.error(error);
            set({error: "Failed to fetch hikes", isLoading: false});
        }
    },

    refresh: async (userId: string) => {
        set({isLoading: true, error: null});
        
        try {
            const hikes = await HikeRepository.fetchAll(userId);
            set({hikes, isLoading: false});
        } catch (error) {
            console.error(error);
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
            console.error(error);
            set({error: "Failed to load hike", isLoading: false});
            return null;
        }
    },

    create: async (hike: Hike, userId: string): Promise<void> => {
        set({isLoading: true, error: null});

        try {
            if(!userId) {
                throw new Error("User ID is required to create hike");
            }

            const response = await HikeRepository.write(hike, userId);
            
            set((state) => {
                const index = state.hikes.findIndex(h => h.id === response.id);
                if(index !== -1){
                    state.hikes[index] = response;
                } else {
                    state.hikes.push(response);
                }
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