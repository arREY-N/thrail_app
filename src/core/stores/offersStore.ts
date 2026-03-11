import { dummyOffers } from "@/src/core/stores/dummyData";
import { create } from "zustand";
import { Store } from "../interface/storeInterface";
import { Offer } from "../models/Offer/Offer";
import { OfferRepository } from "../repositories/offerRepository";

type OfferParams = {
    id: string;
    businessId: string;
}

export interface OfferState extends Store<Offer>{
    trailOffers: Offer[];
    businessOffers: Offer[];

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
    data: dummyOffers,
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

            let offers: Offer[] = [];

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

            let offers: Offer[] = [];
            console.log(data);

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
            
            console.log(offers);
            set({
                trailOffers: offers,
                isLoading: false
            })  

            console.log(get().trailOffers);
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message || 'Failed writing offer',
                isLoading: false
            });
        }
    },

    load: async ({id, businessId }: OfferParams) => {
        set({ isLoading: true, error: null});
        
        if(!id) {
            set({ 
                current: new Offer(), 
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
                console.log('data is filled')
                offer = data.find(d => d.id === id);
            }

            if(!offer){
                console.log('go to repo');
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

    create: async (offer: Offer) => {
        set({isLoading: true, error: null});

        try {
            const newOffer = await OfferRepository.write(offer);

            set(state => {
                const newOfferList = state.businessOffers.filter(o => o.id !== newOffer.id);
                const offers = [...newOfferList, newOffer];
                
                return {
                    businessOffers: offers,
                    data: offers,
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
        
    },

    reset: () => set(init),
}))