import { WriteLocation } from "@/src/core/repositories/locationRepository";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export interface LocationState {
    saveHikeHistory: (params: Omit<WriteLocation, 'groupId'>) => Promise<void>;    
    feedLiveLocation: (params: WriteLocation) => Promise<void>;

    isLoading: boolean;
}

export const useLocationssStore = create<LocationState>()(immer((set, get) => ({
    isLoading: false,

    saveHikeHistory: async (params) => {
        set({ isLoading: true });
        const { userId, location } = params;
        
        try {
            
        } catch (error) {
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    feedLiveLocation: async (params) => {
        const { groupId, userId, location } = params;   

    }
})))