import { BusinessState, businessStoreCreator } from "@/src/core/models/Business/stores/businessStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useBusinessesStore = create<BusinessState>()(
    immer(businessStoreCreator)
);
