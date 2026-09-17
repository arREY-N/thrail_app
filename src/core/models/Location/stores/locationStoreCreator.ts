import { Location, WriteLocation } from "@/src/core/models/Location/interfaces/Location.types";
import { LocationRepo } from "@/src/core/models/Location/repositories/LocationRepository";
import { Unsubscribe } from "firebase/firestore";
import { StateCreator } from "zustand";

export interface LocationState {
    currentLocation: Location | null;
    groupLocations: Record<string, Location[]>;
    isLoading: boolean;
    error: string | null;

    setCurrentLocation: (location: Location | null) => void;
    feedLiveLocation: (params: WriteLocation) => Promise<void>;
    saveHikeHistory: (params: Omit<WriteLocation, "groupId">) => Promise<void>;
    subscribeToGroupLocations: (groupId: string) => Unsubscribe | null;
    unsubscribeFromGroupLocations: (groupId: string) => void;
}

let activeListeners: Record<string, Unsubscribe> = {};

const init = {
    currentLocation: null,
    groupLocations: {},
    isLoading: false,
    error: null,
};

export const locationStoreCreator: StateCreator<
    LocationState,
    [["zustand/immer", never]]
> = (set, get) => ({
    ...init,

    setCurrentLocation: (location: Location | null) => {
        set({ currentLocation: location });
    },

    feedLiveLocation: async (params: WriteLocation) => {
        set({ isLoading: true, error: null });
        try {
            await LocationRepo.liveFeedLocation(params);
            set((state) => {
                const groupList = state.groupLocations[params.groupId] ?? [];
                const existingIdx = groupList.findIndex((loc) => loc.id === params.userId);
                if (existingIdx >= 0) {
                    groupList[existingIdx] = params.location;
                } else {
                    groupList.push(params.location);
                }
                state.groupLocations[params.groupId] = groupList;
                state.isLoading = false;
            });
        } catch (error) {
            console.error("Failed to feed live location:", error);
            set({
                error: error instanceof Error ? error.message : "Failed to feed live location",
                isLoading: false,
            });
            throw error;
        }
    },

    saveHikeHistory: async (params: Omit<WriteLocation, "groupId">) => {
        set({ isLoading: true, error: null });
        try {
            await LocationRepo.writeLocation(params);
            set({ isLoading: false });
        } catch (error) {
            console.error("Failed to save hike history location:", error);
            set({
                error: error instanceof Error ? error.message : "Failed to save location",
                isLoading: false,
            });
            throw error;
        }
    },

    subscribeToGroupLocations: (groupId: string) => {
        if (activeListeners[groupId]) {
            activeListeners[groupId]();
            delete activeListeners[groupId];
        }

        try {
            const unsub = LocationRepo.listenToGroupLocations(groupId, (locations) => {
                set((state) => {
                    state.groupLocations[groupId] = locations;
                });
            });

            activeListeners[groupId] = unsub;

            return () => {
                if (activeListeners[groupId] === unsub) {
                    activeListeners[groupId]();
                    delete activeListeners[groupId];
                } else {
                    unsub();
                }
            };
        } catch (error) {
            console.error("Failed to subscribe to group locations:", error);
            return null;
        }
    },

    unsubscribeFromGroupLocations: (groupId: string) => {
        if (activeListeners[groupId]) {
            activeListeners[groupId]();
            delete activeListeners[groupId];
        }
    },
});
