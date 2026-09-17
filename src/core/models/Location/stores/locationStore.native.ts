import { LocationState, locationStoreCreator } from "@/src/core/models/Location/stores/locationStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useLocationStore = create<LocationState>()(
    persist(
        immer(locationStoreCreator),
        {
            name: "location-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentLocation: state.currentLocation,
            }),
        }
    )
);

export const useLocationsStore = useLocationStore;
