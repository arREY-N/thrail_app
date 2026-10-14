import { ApplicationState, applicationStoreCreator } from "@/src/core/models/Application/stores/applicationStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useApplicationsStore = create<ApplicationState>()(
    persist(
        immer(applicationStoreCreator),
        {
            name: "application-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
