import { BusinessState, businessStoreCreator } from "@/src/core/models/Business/stores/businessStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useBusinessesStore = create<BusinessState>()(
    persist(
        immer(businessStoreCreator),
        {
            name: "business-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
