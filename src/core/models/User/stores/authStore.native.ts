import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { AuthState, authStoreCreator } from "./authStoreCreator";

export const useAuthStore = create<AuthState>()(
    persist(
        immer(authStoreCreator),
        {
            name: "thrail-auth-storage",
            storage: createJSONStorage(() => AsyncStorage),
            // Whitelist safe serializable properties to survive on disk
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
                role: state.role,
                businessId: state.businessId,
                remember: state.remember,
            }),
            // Mark hydration complete as soon as Zustand finishes reading disk
            onRehydrateStorage: (state) => {
                return (instantiatedState, error) => {
                    if (!error && instantiatedState) {
                        instantiatedState.setHydrated(true);
                    }
                };
            },
        }
    )
);