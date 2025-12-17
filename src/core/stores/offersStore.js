import { create } from "zustand";
import { fetchAllOffers } from "../repositories/offerRepository";

/**
 * Offers shared store
 */
export const useOffersStore = create((set, get) => ({
    offers: [],
    isLoading: false,
    error: null,

    /**
     * Load offers only once
     */
    loadOffers: async () => {
        if(get().offers.length > 0) return;

        set({isLoading: true, error: null});

        try {
            const offers = await fetchAllOffers();
            set({offers, isLoading: false})
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load offers',
                isLoading: false
            });
        }
    },

    refreshOffers: async () => {
        set({isLoading: true, error: null});

        try {
            const offers = await fetchAllOffers();
            set({offers, isLoading: false});
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load offers',
                isLoading: false
            });
        }
    }
}))