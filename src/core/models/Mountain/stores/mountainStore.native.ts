import { MountainState, mountainStoreCreator } from "@/src/core/models/Mountain/stores/mountainStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useMountainStore = create<MountainState>()(
    persist(
        immer(mountainStoreCreator),
        {
            name: "mountain-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export const useMountainsStore = useMountainStore;
