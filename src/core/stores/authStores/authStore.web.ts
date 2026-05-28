import { AuthState, authStoreCreator } from "@/src/core/stores/authStores/authStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useAuthStore = create<AuthState>()(
    immer(authStoreCreator)
);
