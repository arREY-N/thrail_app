import { CancellationState, cancellationStoreCreator } from "@/src/core/models/Cancellation/stores/cancellationStoreCreator";
import { createThrottledJSONStorage } from "@/src/core/utility/createThrottledAsyncStorage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useCancellationStore = create<CancellationState>()(
    persist(
        immer(cancellationStoreCreator),
        {
            name: 'cancellation-storage',
            storage: createThrottledJSONStorage(500),
            partialize: (state) => ({
                offerCancellations: state.offerCancellations,
                userCancellations: state.userCancellations,
            }),
        }
    )
);