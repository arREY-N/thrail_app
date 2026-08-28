import { UserState, userStoreCreator } from "@/src/core/models/User/stores/userStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useUserStore = create<UserState>()(
    immer(userStoreCreator)
);
