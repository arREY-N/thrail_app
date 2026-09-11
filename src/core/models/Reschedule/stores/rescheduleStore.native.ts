import { RescheduleState, rescheduleStoreCreator } from "@/src/core/models/Reschedule/stores/rescheduleStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useRescheduleStore = create<RescheduleState>()(
    persist(
        immer(rescheduleStoreCreator),
        {
            name: 'reschedule-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);