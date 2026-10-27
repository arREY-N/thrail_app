import { OfferState, offerStoreCreator } from "@/src/core/models/Offer/stores/offerStoreCreator";
import { createThrottledJSONStorage } from "@/src/core/utility/createThrottledAsyncStorage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useOfferStore = create<OfferState>()(
    persist(
        immer(offerStoreCreator),
        {
            name: 'offer-storage',
            storage: createThrottledJSONStorage(500),
            partialize: (state) => ({
                data: state.data.length > 0 ? state.data : [],
                businessOffers: state.businessOffers.length > 0 ? state.businessOffers : [],
                trailOffers: state.trailOffers.length > 0 ? state.trailOffers : [],
                current: state.current,
            })
        }
    )
);