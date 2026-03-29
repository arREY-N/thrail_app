import { Hike } from "@/src/core/models/Hike/Hike";
import { HikeRepository } from "@/src/core/repositories/hikeRepository";
import { dummyHikes } from "@/src/core/stores/dummy/dummyHike";
import { StateCreator } from "zustand";

export interface HikeState {
    hikes: Hike[];
    isLoading: boolean;
    error: string | null;

    currentHike: Hike | null;
    elapsedTime: number;
    timerStartTime: number;
    active: boolean;

    updateCurrentHike: (patch: Partial<Hike>) => void;  
    updateHikeStore: (patch: Partial<Hike>) => void;

    fetchAll: (userId: string) => Promise<void>;
    refresh: (userId: string) => Promise<void>;
    load: (id: string, userId: string) => Promise<Hike | null>;
    create: (hike: Hike, userId: string) => Promise<void>;
    remove: (id: string, userId: string) => Promise<void>;
}

export const hikeStoreCreator: StateCreator<HikeState, [["zustand/immer", never]]> = (set, get) => ({
    hikes: dummyHikes,
    isLoading: false,
    error: null,
    currentHike: null,
    elapsedTime: 0,
    timerStartTime: 0,
    active: false,
    
    updateCurrentHike: (patch) => set((state) => {
        if(state.currentHike) {
            Object.assign(state.currentHike, patch);
        }
    }),

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