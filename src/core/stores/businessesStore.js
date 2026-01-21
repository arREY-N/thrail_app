import { create } from "zustand";
import {
    createBusiness,
    createBusinessAdmin,
    deactivateBusiness,
    fetchBusiness,
    fetchBusinessAdmins,
    fetchBusinesses
} from "../repositories/businessRepository";

const init = {
    businesses: [],
    businessAccount: null,
    businessAdmins: [],
    isLoading: null,
    error: null,
}

export const useBusinessesStore = create((set, get) => ({
    ...init, 

    reset: () => set(init),

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

    reloadBusinesses: async () => {
        set({isLoading: true, error: null});

        try {
            const businesses = await fetchBusinesses();;
            set({businesses, isLoading: false})
        } catch (err) {
            set({
                error: err.message ?? 'Failed to reload businesses',
                isLoading: false
            });
        }
    },

    loadBusinessAccount: async (id) => {
        set({isLoading: true, error: null});
        
        try{
            if(!id) throw new Error('Invalid business ID');

            console.log('ID: ', id);

            const businessAccount = await fetchBusiness(id);

            console.log('Accnt: ',businessAccount);

            set({businessAccount, isLoading: false})
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load business account', 
                isLoading: false
            });
        }
    },

    addBusiness: async (businessData) => {
        set({isLoading: true, error: null});

        try {
            if(!businessData) throw new Error('Invalid business data');
            
            const newAccount = await createBusiness(businessData);
            console.log('New: ', newAccount)

            const sanitizedAccount = {
                ...newAccount,
                createdAt: newAccount.createdAt?._seconds 
                    ? new Timestamp(newAccount.createdAt._seconds, newAccount.createdAt._nanoseconds)
                    : newAccount.createdAt,
                updatedAt: newAccount.updatedAt?._seconds 
                    ? new Timestamp(newAccount.updatedAt._seconds, newAccount.updatedAt._nanoseconds)
                    : newAccount.updatedAt               
            };

            console.log('Sanitized: ', sanitizedAccount);

            set((state) => {
                return {
                    businesses: [...state.businesses, sanitizedAccount],
                    isLoading: false
                }
            });
        } catch (err) {
            set({
                error: err.message ?? 'Failed adding business', 
                isLoading: false
            });
        }
    },

    deleteBusiness: async (id) => {
        set({isLoading: true, error: null});

        try{
            const archived = await deactivateBusiness(id);

            set((state) => {
                return {
                    businesses: [...state.businesses.filter(b => b.id !== id), archived],
                    isLoading: false
                }
            })
        } catch (err) {
            set({
                error: err.message ?? 'Failed deleting business',
                isLoading: false,
            })
        }
    },

    loadBusinessAdmins: async (providedBusinessId = null) => {
        set({isLoading: true, error: null});

        if(get().businessAccount && get().businessAdmins.length > 0) return;

        try {
            const targetID = providedBusinessId || get().businessAccount.id;
            console.log('Target ID: ', targetID);
            if(!targetID) throw new Error('Missing Business ID');

            const businessAdmins = await fetchBusinessAdmins(targetID);
            console.log(businessAdmins);
            set({
                businessAdmins,
                isLoading: false
            })
        } catch (err) {
            set({
                isLoading: false,
                error: err.message ?? 'Failed loading admins'
            })
        }
    },

    createBusinessAdmin: async ({userId, businessId}) => {
        set({isLoading: true, error: null});

        try{
            await createBusinessAdmin({userId, businessId});

            const businessAdmin = await fetchBusinessAdmins(userId);
            set((state) => {
                return {
                    businessAdmins: [...state.businessAdmins, businessAdmin],
                    isLoading: false
                }
            })
        } catch (err) {
            set({
                error: err.message ?? 'Store: Failed creating business admin',
                isLoading: false,
            })
        }
    },

    reloadBusinessAdmins: async (providedBusinessId = null) => {
        set({isLoading: true, error: null});

        try {
            const targetID = providedBusinessId || get().businessAccount.id;
            console.log('Target ID: ', targetID);
            if(!targetID) throw new Error('Missing Business ID');

            const businessAdmins = await fetchBusinessAdmins(targetID);
            console.log(businessAdmins);
            set({
                businessAdmins,
                isLoading: false
            })
            
        } catch (err) {
            set({
                isLoading: false,
                error: err.message ?? 'Failed loading admins'
            })
        }
    }
}));