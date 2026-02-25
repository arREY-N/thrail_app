import { Application } from "@/src/types/entities/Application";
import { Business } from "@/src/types/entities/Business";
import { UserUI } from "@/src/types/entities/User";
import { create } from "zustand";
import { BaseStore } from "../interface/storeInterface";
import { BusinessRepository } from "../repositories/businessRepository";

type AdminUI = {
    user: UserUI,
    businessId: string,
}

export interface BusinessState extends BaseStore<Business>{
    businessAdmins: UserUI[] 

    createBusinessAdmin: (admin: AdminUI) => Promise<void>
    loadBusinessAdmins: (providedBusinessId: string | null) => Promise<void>;
    reloadBusinessAdmins: (providedBusinessId: string | null) => Promise<void>;
}

const init = {
    data: [],
    current: null,
    businessAdmins: [],
    isLoading: true,
    error: null,
}

export const useBusinessesStore = create<BusinessState>((set, get) => ({
    ...init, 

    fetchAll: async () => {
        const data = get().data;

        if(data.length > 0) return;

        try {
            set({ isLoading: true, error: null})

            const businesses = await BusinessRepository.fetchAll();

            if(businesses.length === 0){
                set({
                    data: [],
                    isLoading: false
                })
                return;
            }

            set({
                data: businesses,
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            })
        }
    },
    
    refresh: async () => {
        try {
            set({ isLoading: true, error: null})

            const businesses = await BusinessRepository.fetchAll();

            if(businesses.length === 0){
                set({
                    data: [],
                    isLoading: false
                })
                return;
            }

            set({
                data: businesses,
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            })
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
                business = await BusinessRepository.fetchById(id);
            }

            if(!business){
                set({
                    error: 'Business not found',
                    isLoading: false
                })
                return;
            }

            set({
                current: business,
                isLoading: false
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            })
        }
    },

    create: async (application: Application, id: string) => {
        set({isLoading: true, error: null});

        try {
            if(!application) throw new Error('Invalid business data');
            
            const business = Business.fromApplication(application);

            console.log('BusinessStore: ', business);

            console.log('ID:' ,id);
            const newAccount = await BusinessRepository.write(
                business,
                id,
            );
            
            console.log('New: ', newAccount)

            const sanitizedAccount = {
                ...newAccount,
                createdAt: newAccount.createdAt,
                updatedAt: newAccount.updatedAt               
            };

            console.log('Sanitized: ', sanitizedAccount);

            set((state) => {
                return {
                    businesses: [...state.data, sanitizedAccount],
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
            const userId = user.id as string;

            if(role === 'admin') {
                set({
                    error: 'Already an admin',
                    isLoading: false
                })
                return;
            }          

            const uid = await BusinessRepository.createBusinessAdmin({userId, businessId});
            

            set((state) => {
                return {
                    businessAdmins: [...state.businessAdmins, user],
                    isLoading: false
                }
            })
        } catch (err) {
            console.error((err as Error).message)
            set({
                error: (err as Error).message ?? 'Store: Failed creating business admin',
                isLoading: false,
            })
        }
    },
}));