import { BusinessState, businessStoreCreator } from "@/src/core/models/Business/stores/businessStoreCreator";
import { createThrottledJSONStorage } from "@/src/core/utility/createThrottledAsyncStorage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useBusinessesStore = create<BusinessState>()(
    persist(
        immer(businessStoreCreator),
        {
            name: "business-storage",
            storage: createThrottledJSONStorage(500),
            partialize: (state) => ({
                data: state.data,
                current: state.current,
                businessAdmins: state.businessAdmins,
                lastFetchedAt: state.lastFetchedAt,
            }),
        }
    )
);
