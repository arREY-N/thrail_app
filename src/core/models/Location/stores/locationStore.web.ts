import { LocationState, locationStoreCreator } from "@/src/core/models/Location/stores/locationStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useLocationStore = create<LocationState>()(
    immer(locationStoreCreator)
);

export const useLocationsStore = useLocationStore;
