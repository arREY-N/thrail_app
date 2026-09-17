import { TrailState, trailStoreCreator } from "@/src/core/models/Trail/stores/trailStoreCreator";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useTrailStore = create<TrailState>()(
    persist(
        immer(trailStoreCreator),
        {
            name: 'trail-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                data: state.data,
                current: state.current,
                hikingTrail: {
                    trail: state.hikingTrail?.trail,
                    hiking: state.hikingTrail?.hiking,
                },
                recommendedTrail: state.recommendedTrail,
                discoverTrail: state.discoverTrail,
            }),
        }
    )
);

export const useTrailsStore = useTrailStore;
