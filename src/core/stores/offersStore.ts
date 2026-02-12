import { BusinessUI } from "@/src/types/entities/Business";
import { OfferBusiness, OfferUI } from "@/src/types/entities/Offer";
import { create } from "zustand";
import { Store } from "../interface/storeInterface";
import { OfferRepository } from "../repositories/offerRepository";
import { editProperty } from "../utility/editProperty";

type OfferParams = {
    id: string;
    businessId: string;
}

export interface OfferState extends Store<OfferUI>{
    trailOffers: OfferUI[] | [];
    businessOffers: OfferUI[] | [];

    fetchOfferByBusiness: (id: string) => Promise<void>;
    fetchOfferByTrail: (id: string) => Promise<void>;
}

const OFFER_TEMPLATE = {
    date: null,
    price: null,
    description: null,
    documents: [],
    duration: null,
    inclusions: [],
    trail: null,
}

const init = {
    data: [],
    current: null,
    isLoading: false,
    error: null,
    documents: [],
    sort: null,
    trailOffers: [],
    businessOffers: [],
}

export const useOffersStore = create<OfferState>((set, get) => ({
    ...init,

    fetchAll: async () => {
        set({ isLoading: true, error: null })
        
        const data = get().data;
        
        if(data.length > 0) {
            set({ isLoading: false, error: null})
            return;
        }

        try {
            const offers = await OfferRepository.fetchAll();

            if(offers.length === 0){
                set({
                    data: [],
                    error: 'No offers found',
                    isLoading: false
                })
            }
            
            set({
                data: offers,
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

    fetchOfferByBusiness: async (id: string) => {
        set({ isLoading: true, error: null })
        
        if(!id){
            set({
                isLoading: false,
                error: 'No ID selected',
            })
            return;
        }        

        try {
            const data = get().data;

            let offers: OfferUI[] = [];

            if(data.length > 0) {
                offers = data.filter(o => o.business.id ===id);
            };
            
            if(offers.length === 0){
                offers = await OfferRepository.fetchAllBusinessOffers(id);
            }

            if(offers.length === 0){
                set({
                    businessOffers: [],
                    error: 'No offers found',
                    isLoading: false
                })
            }
            
            set({
                businessOffers: offers,
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

    fetchOfferByTrail: async (id: string) => {
        set({ isLoading: true, error: null });
        
        if(!id){
            set({
                isLoading: false, 
                error: 'No trail ID selected'
            });
            return;
        }

        try {
            const data = get().data;

            let offers: OfferUI[] = [];

            if(data.length > 0){
                offers = data.filter(o => o.trail.id === id)
            }

            if(offers.length === 0){
                offers = await OfferRepository.fetchAllTrailOffers(id);
            }

            if(offers.length === 0){
                set({
                    error: 'No offers for this trail',
                    trailOffers: [],
                    isLoading: false
                })
                return;
            }
            
            set({
                trailOffers: offers,
                isLoading: false
            })  
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed writing offer',
                isLoading: false
            })
        }
    },

    load: async ({id, businessId }: OfferParams) => {
        set({ isLoading: true, error: null});
        
        if(!id) {
            set({ 
                current: new OfferUI(), 
                isLoading: false 
            }); 
            return;
        }

        if(!businessId){
            set({ 
                error: 'No Business ID selected',
                isLoading: false,
            });
            return;
        }

        try {
            const data = get().data;

            let offer = null;

            if(data.length > 0){
                offer = data.find(d => d.id === id);
            }

            if(!offer){
                offer = await OfferRepository.fetchById({id, businessId});
            }

            if(!offer){
                set({
                    error: 'Offer not found',
                    isLoading: false,
                })
                return;
            }

            set({
                current: offer,
                isLoading: false, 
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed writing offer',
                isLoading: false
            })
        }
    },

    create: async (data: BusinessUI) => {
        set({isLoading: true, error: null});

        try {
            const business: OfferBusiness = {
                id: data.id || '',
                name: data.name 
            }

            const offer = new OfferUI({...get().current, business});
    
            const newOffer = await OfferRepository.write(offer);

            const optimisticOffer = {
                ...newOffer,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            set(state => {
                const newOfferList = state.businessOffers.filter(o => o.id !== optimisticOffer.id);
                const offers = [...newOfferList, optimisticOffer];
                
                return {
                    businessOffers: offers,
                    isLoading: false
                }
            });
            return true;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed to create new offer',
                isLoading: false
            })
            return false;
        }
    },
    
    refresh: async () => {
        set({ isLoading: true, error: null })
        try {
            const offers = await OfferRepository.fetchAll();

            set({
                data: offers,
                isLoading: false,
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message,
                isLoading: false,
            })
        }
    },

    delete: async ({id, businessId}: OfferParams) => {
        set({isLoading: true, error: null});

        try {
            if(!id || !businessId){
                throw new Error('Offer and Business ID missing');
            }

            await OfferRepository.delete({id, businessId})
            
            set((state) => {
                return {
                    businessOffers: state.businessOffers.filter(o => o.id !== id),
                    isLoading: false,
                }
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed to delete offer',
                isLoading: false
            })
        }
    },

    edit: (property) => {
        set((state) => {
            if(!state.current) return state;
            return {
                current: editProperty(state.current, property)
            }
        })
    },

    reset: () => set(init),
}))