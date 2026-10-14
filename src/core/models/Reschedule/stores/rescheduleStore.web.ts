import { RescheduleState, rescheduleStoreCreator } from "@/src/core/models/Reschedule/stores/rescheduleStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useRescheduleStore = create<RescheduleState>()(
    immer(rescheduleStoreCreator)
)