import { RescheduleState, rescheduleStoreCreator } from "@/src/core/models/Reschedule/stores/rescheduleStoreCreator";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useRescheduleStore = create<RescheduleState>()(
    persist(
        immer(rescheduleStoreCreator),
        {
            name: 'reschedule-storage',
        }
    )
)