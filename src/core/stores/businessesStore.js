import { create } from "zustand";
import { createBusinessAccount, fetchBusinessAccount, fetchBusinesses } from "../repositories/businessRepository";

export const useBusinessesStore = create((set, get) => ({
    businesses: [],
    businessAccount: [],
    isLoading: null,
    error: null,

    loadBusinesses: async () => {
        if(get().businesses.length > 0) return;

        set({isLoading: true, error: null});

        try {
            const businesses = await fetchBusinesses();
            set({businesses, isLoading: false})
        } catch (err) {
            set({
                error: err.message ?? 'Failed to fetch businesses',
                isLoading: false
            });
        }
    },

    loadBusinessAccount: async (id) => {
        set({isLoading: true, error: null});
        
        try{
            if(!id) throw new Error('Invalid business ID');

            const businessAccount = await fetchBusinessAccount(id);
            set({businessAccount, isLoading: false})
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load business account', 
                isLoading: false
            });
        }
    },

    addBusinessAccount: async (businessData) => {
        set({isLoading: true, error: null});

        try {
            if(!businessData) throw new Error('Invalid business data');
            console.log('data: ', businessData);
            
            const newAccount = await createBusinessAccount(businessData);

            console.log('New account: ', newAccount);
            
            set(state => ({
                businesses: [
                    {newAccount, ...businessData},
                    ...state.offers
                ],
                isLoading: false
            }));
        } catch (err) {
            set({
                error: err, 
                isLoading: false
            });
        }
    }
}));