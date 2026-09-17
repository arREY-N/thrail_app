import { OfferState, offerStoreCreator } from "@/src/core/models/Offer/stores/offerStoreCreator";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export const useOfferStore = create<OfferState>()(
    immer(offerStoreCreator),
)