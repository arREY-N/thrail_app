import { MountainState, mountainStoreCreator } from "@/src/core/models/Mountain/stores/mountainStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useMountainStore = create<MountainState>()(
    immer(mountainStoreCreator)
);

export const useMountainsStore = useMountainStore;
