import { HikeState, hikeStoreCreator } from "@/src/core/models/Hike/stores/hikeStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useHikeStore = create<HikeState>()(
    persist(
        immer(hikeStoreCreator),
        {
            name: "hike-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                currentHike: state.currentHike,
                elapsedTime: state.elapsedTime,
                timerStartTime: state.timerStartTime,
                totalDistance: state.totalDistance,
                totalElevationGain: state.totalElevationGain,
                active: state.active,
            }),
        }
    )
);

export const useHikesStore = useHikeStore;
