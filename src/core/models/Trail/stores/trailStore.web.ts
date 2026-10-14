import { TrailState, trailStoreCreator } from "@/src/core/models/Trail/stores/trailStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useTrailStore = create<TrailState>()(
    immer(trailStoreCreator)
);

export const useTrailsStore = useTrailStore;
