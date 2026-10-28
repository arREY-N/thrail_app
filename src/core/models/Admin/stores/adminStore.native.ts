import { AdminState, adminStoreCreator } from "@/src/core/models/Admin/stores/adminStoreCreator";
import { createThrottledJSONStorage } from "@/src/core/utility/createThrottledAsyncStorage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useAdminStore = create<AdminState>()(
    persist(
        immer(adminStoreCreator),
        {
            name: "admin-storage",
            storage: createThrottledJSONStorage(500),
        }
    )
);