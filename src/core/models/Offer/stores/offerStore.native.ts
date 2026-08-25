import { OfferState, offerStoreCreator } from "@/src/core/models/Offer/stores/offerStoreCreator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useOfferStore = create<OfferState>()(
    persist(
        immer(offerStoreCreator),
        {
            name: 'offer-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)