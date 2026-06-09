import { TrailState, trailStoreCreator } from "@/src/core/stores/trailStores/trailStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useTrailsStore = create<TrailState>()(
    immer(trailStoreCreator)
);
