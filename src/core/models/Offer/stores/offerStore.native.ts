import { OfferState, offerStoreCreator } from "@/src/core/models/Offer/stores/offerStoreCreator";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useOfferStore = create<OfferState>()(
    persist(
        immer(offerStoreCreator),
        {
            name: 'offer-storage',
        }
    )
)