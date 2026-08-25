import { AdminState, adminStoreCreator } from "@/src/core/models/Admin/stores/adminStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useAdminStore = create<AdminState>()(
    persist(
        immer(adminStoreCreator),
        {
            name: "admin-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);