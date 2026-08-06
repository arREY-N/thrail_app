import { CancellationState, cancellationStoreCreator } from "@/src/core/models/Cancellation/stores/cancellationStoreCreator";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useCancellationStore = create<CancellationState>()(
    persist(
        immer(cancellationStoreCreator),
        {
            name: 'cancellation-storage',
        }
    )
);