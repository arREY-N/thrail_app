import { CancellationState, cancellationStoreCreator } from "@/src/core/models/Cancellation/stores/cancellationStoreCreator";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useCancellationStore = create<CancellationState>()(
    persist(
        immer(cancellationStoreCreator),
        {
            name: 'cancellation-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);