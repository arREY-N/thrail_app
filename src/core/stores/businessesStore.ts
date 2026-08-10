import { BaseStore } from "@/src/core/interface/storeInterface";
import { Admin } from "@/src/core/models/Admin/Admin";
import { Business } from "@/src/core/models/Business/Business";
import { User } from "@/src/core/models/User/User";
import { BusinessRepository } from "@/src/core/repositories/businessRepository";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * 
 * Currently refactoring
 * Still used by old code
 * New store can be found in
 * @src/core/models/Booking/stores/bookingStoreCreator.ts
 * 
 */

type AdminUI = {
    user: User,
    businessId: string,
}

export interface BusinessState extends BaseStore<Business>{
    businessAdmins: Admin[];
    lastFetchedAt: number;

    createBusinessAdmin: (admin: AdminUI) => Promise<void>;
    loadBusinessAdmins: (providedBusinessId: string | null) => Promise<void>;
    reloadBusinessAdmins: (providedBusinessId: string | null) => Promise<void>;
}

const init = {
    data: [],
    current: null,
    businessAdmins: [],
    lastFetchedAt: 0,
    isLoading: true,
    error: null,
};

export const useBusinessesStore = create<BusinessState>()(immer((set, get) => ({
    ...init, 

    fetchAll: async () => {
        const data = get().data;

        if(data.length > 0) return;

        try {
            set({ isLoading: true, error: null});

            const businesses = await BusinessRepository.fetchAll();

            set({
                data: businesses,
                lastFetchedAt: Date.now(),
                isLoading: false
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
        }
    },
    
    refresh: async () => {
        const now = Date.now();
        const lastFetchedAt = get().lastFetchedAt;
        const COOLDOWN_MS = 2000; // 2-second throttle cooldown for Firebase cost optimization

        if (now - lastFetchedAt < COOLDOWN_MS && get().data.length > 0) {
            console.log('Throttled refresh: reusing in-memory cache to save Firestore reads.');
            return;
        }

        try {
            set({ isLoading: true, error: null});

            const businesses = await BusinessRepository.fetchAll();

            set({
                data: businesses,
                lastFetchedAt: now,
                isLoading: false
            });
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            });
        }
    },

    load: async (id: string | null) => {
        if(!id){
            set({ current: new Business() })
            return;
        }

        const data = get().data;        

        try {
            set({ isLoading: true, error: null})

            let business = null;

            if(data.length > 0) {
                business = data.find(d => d.id === id);
            }

            if(!business){
                console.log('calling repo');
                business = await BusinessRepository.fetchById(id);
            }

            if(!business){
                set({
                    error: 'Business not found',
                    isLoading: false
                })
                return;
            }

            set((state) => {
                const updated = state.data.map(u => u.id !== id);

                return {
                    current: business,
                    data: [...updated, business],
                    isLoading: false
                }
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            })
        }
    },

    create: async (business: Business, applicationId: string) => {
        set({isLoading: true, error: null});

        try {
            const newAccount = await BusinessRepository.write(business, applicationId);
    
            set((state) => {
                return {
                    businesses: [...state.data, newAccount],
                    isLoading: false
                }
            });
            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed adding business', 
                isLoading: false
            });
            return false;
        }
    },

    edit: () => {

    },

    delete: async (id: string) => {
        set({isLoading: true, error: null});

        try{
            const archived = await BusinessRepository.delete(id);

            set((state) => {
                return {
                    businesses: [...state.data.filter(b => b.id !== id), archived],
                    isLoading: false
                }
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed deleting business',
                isLoading: false,
            })
        }
    }, 

    reset: () => set(init),

    loadBusinessAdmins: async (providedBusinessId: string | null = null) => {
        if(get().current && get().businessAdmins.length > 0) return;
        
        set({isLoading: true, error: null});

        try {
            const targetID = providedBusinessId || get().current?.id;
            console.log('Target ID: ', targetID);
            if(!targetID) throw new Error('Missing Business ID');

            const businessAdmins = await BusinessRepository.fetchBusinessAdmins(targetID);

            set({
                businessAdmins,
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message)
            set({
                isLoading: false,
                error: (err as Error).message ?? 'Failed loading admins'
            })
        }
    },
    
    reloadBusinessAdmins: async (providedBusinessId: string | null = null) => {
        set({isLoading: true, error: null});

        try {
            const targetID = providedBusinessId || get().current?.id;
            console.log('Target ID: ', targetID);
            if(!targetID) throw new Error('Missing Business ID');

            const businessAdmins = await BusinessRepository.fetchBusinessAdmins(targetID);

            set({
                businessAdmins,
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message)
            set({
                isLoading: false,
                error: (err as Error).message ?? 'Failed loading admins'
            })
        }
    },

    createBusinessAdmin: async ({user, businessId}: AdminUI) => {
        set({isLoading: true, error: null});

        try{
            const role = user.role as string;

            // checking if user is already an admin or system admin
            if(role === 'admin' || get().businessAdmins.some(a => a.id === user.id)) {
                const errMsg = 'User is already an admin of this business';
                set({
                    error: errMsg,
                    isLoading: false
                })
                throw new Error(errMsg);
            }          

            const admin = await BusinessRepository.createBusinessAdmin(user, businessId);
            
            set((state) => {
                return {
                    businessAdmins: [...state.businessAdmins, admin],
                    isLoading: false
                }
            })
        } catch (err) {
            console.error((err as Error).message)
            set({
                error: (err as Error).message ?? 'Store: Failed creating business admin',
                isLoading: false,
            })
            throw err;
        }
    },
})));