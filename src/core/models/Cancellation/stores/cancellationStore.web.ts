import { CancellationState, cancellationStoreCreator } from "@/src/core/models/Cancellation/stores/cancellationStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useCancellationStore = create<CancellationState>()(
    immer(cancellationStoreCreator),
);