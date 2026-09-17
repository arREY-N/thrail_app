import { UserState, userStoreCreator } from "@/src/core/models/User/stores/userStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useUserStore = create<UserState>()(
    persist(
        immer(userStoreCreator),
        {
            name: "user-storage",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                data: state.data,
            }),
        }
    )
);
