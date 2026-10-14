import { HikeState, hikeStoreCreator } from "@/src/core/models/Hike/stores/hikeStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useHikeStore = create<HikeState>()(
    immer(hikeStoreCreator)
);

export const useHikesStore = useHikeStore;
