import { OfferRepo } from "@/src/core/init/repositories";
import { createOffer, Offer } from "@/src/core/models/Offer/OfferFactory";
import { upsertItem } from "@/src/core/models/utils/upsert";
import { StateCreator } from "zustand";

type OfferParams = {
    id: string;
    businessId: string;
}

export interface OfferState {
    isLoading: boolean;
    error: string | null;
    data: Offer[];
    trailOffers: Offer[];
    businessOffers: Offer[];
    current: Offer | null;

    delete: (params: OfferParams) => Promise<void>;
    reset: () => void;
    fetchAll: () => Promise<void>;
    fetchOfferByBusiness: (id: string) => Promise<void>;
    fetchOfferByTrail: (id: string) => Promise<void>;
    fetchOfferById: (id: string) => Promise<void>;
    createOffer: (offer: Offer) => Promise<Offer | null>;
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

export const offerStoreCreator: StateCreator<OfferState, [["zustand/immer", never]]> = (set, get) => ({
    ...init,

    fetchAll: async () => {
        set({ isLoading: true, error: null })
        
        const data = get().data;
        
        if(data.length > 0) {
            set({ isLoading: false, error: null})
            return;
        }

        try {
            const offers = await OfferRepo.fetchAll();

            if(offers.length === 0){
                set({
                    data: [],
                    error: 'No offers found',
                    isLoading: false
                })
                return;
            }
            
            set({
                data: offers,
                isLoading: false
            })
        } catch (err) {
            set({ isLoading: false, error: (err as Error).message || 'Failed fetching offers' })
            throw err;
        }
    },

    fetchOfferByBusiness: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
            if(!id)
                throw new Error('No ID provided')
                
            const data = get().businessOffers;

            let offers: Offer[] = [];

            if(data.length > 0) {
                offers = data.filter(o => o.business.id === id);
            };
            
            if(offers.length === 0){
                offers = await OfferRepo.fetchAllBusinessOffers(id);
            }

            if(offers.length === 0){
                set({
                    businessOffers: [],
                    error: 'No offers found',
                    isLoading: false
                })
                return;
            }
            
            set({
                businessOffers: offers,
                isLoading: false
            })
        } catch (err) {
            set({ isLoading: false })
            throw err
        }
    },

    fetchOfferById: async (id: string): Promise<void> => {
        try {
            set({ isLoading: true, error: null });

            let offer = null;

            if(get().data.length > 0) {
                offer = get().data.find(o => o.id === id);
            }

            if(!offer){
                offer = get().trailOffers.find(o => o.id === id);
            }

            if(!offer){
                offer = get().businessOffers.find(o => o.id === id);
            }

            if(!offer){
                offer = await OfferRepo.fetch(id);
            }

            if(!offer){
                throw new Error('No offer found');
            }

            set({
                data: upsertItem(get().data, offer), 
                isLoading: false, 
                error: null 
            });
        } catch (error) {
            set({ isLoading: false })
            throw error
        }
    },

    fetchOfferByTrail: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
            if(!id)
                throw new Error('No ID provided')

            const data = get().data;

            let offers: Offer[] = [];

            if(data.length > 0){
                offers = data.filter(o => o.trail?.id === id)
            }
            
            if(offers.length === 0){
                offers = await OfferRepo.fetchAllTrailOffers(id);
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
            set({
                error: (err as Error).message || 'Failed writing offer',
                isLoading: false
            });
            throw err;
        }
    },

    load: async ({id, businessId }: OfferParams) => {
        set({ isLoading: true, error: null});
        
        if(!id) {
            set({ 
                current: createOffer(), 
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
                offer = await OfferRepo.fetchById({id, businessId});
            }

            if(!offer){
                set({
                    error: 'Offer not found in load',
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

    createOffer: async (offer: Offer): Promise<Offer | null> => {
        set({isLoading: true, error: null});

        try {
            const newOffer = await OfferRepo.write(offer);

            set(state => {
                const newOfferList = state.businessOffers.filter(o => o.id !== newOffer.id);
                const offers = [...newOfferList, newOffer];
                
                return {
                    businessOffers: offers,
                    data: offers,
                    isLoading: false
                }
            });
            return newOffer;
        } catch (err) {
            console.error((err as Error).message);
            set({
                error: (err as Error).message ?? 'Failed to create new offer',
                isLoading: false
            })
            return null;
        }
    },

    create: async (offer: Offer) => {
        set({isLoading: true, error: null});

        try {
            const newOffer = await OfferRepo.write(offer);

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
            const offers = await OfferRepo.fetchAll();

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

            await OfferRepo.delete({id, businessId})
            
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
            throw err;
        }
    },

    edit: () => {
        
    },

    reset: () => set(init),
})