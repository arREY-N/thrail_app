import { AdminState, adminStoreCreator } from "@/src/core/models/Admin/stores/adminStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useAdminStore = create<AdminState>()(
    immer(adminStoreCreator)
);

export const useAdminsStore = useAdminStore;
