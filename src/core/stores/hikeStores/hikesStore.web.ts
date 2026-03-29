import { HikeState, hikeStoreCreator } from "@/src/core/stores/hikeStores/hikeStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useHikesStore = create<HikeState>()(
    immer(hikeStoreCreator)
);
