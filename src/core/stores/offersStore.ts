import { BaseStore } from "@/src/core/interface/storeInterface";
import { Offer } from "@/src/core/models/Offer/Offer";
import { OfferRepository } from "@/src/core/repositories/offerRepository";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type OfferParams = {
    id: string;
    businessId: string;
}

export interface OfferState extends Omit<BaseStore<Offer>, 'delete'>{
    trailOffers: Offer[];
    businessOffers: Offer[];
    delete: (params: OfferParams) => Promise<void>;

    fetchOfferByBusiness: (id: string) => Promise<void>;
    fetchOfferByTrail: (id: string) => Promise<void>;
    loadOffer: (offerId: string) => Promise<void>;  
    fetchOfferById: (id: string) => Promise<Offer>;
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

export const useOffersStore = create<OfferState>()(
    immer((set, get) => ({
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
                offers = await OfferRepository.fetchAllBusinessOffers(id);
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

    fetchOfferById: async (id: string): Promise<Offer> => {
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
                offer = await OfferRepository.fetch(id);
            }

            if(!offer){
                throw new Error('No offer found');
            }

            set({ isLoading: false, error: null });

            return offer;
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
            
            set({
                trailOffers: offers,
                isLoading: false
            })  

            console.log(get().trailOffers);
        } catch (err) {
            set({
                error: (err as Error).message || 'Failed writing offer',
                isLoading: false
            });
            throw err;
        }
    },

    loadOffer: async (offerId: string) => {
        set({ isLoading: true, error: null })
        try {
            if(!offerId)
                throw new Error('No offer ID provided');


            let offer = null;

            if(get().data.length > 0){
                offer = get().data.find(o => o.id === offerId);
            }

            if(!offer){
                offer = await OfferRepository.fetch(offerId)
            }

            if(!offer)
               throw new Error('Offer not found in loadoffer');
            
            set((state) => {
                state.current = offer;
                state.isLoading = false;
                state.error = null;
                state.data = [...state.data.filter(o => o.id !== offer.id), offer]
            })
        } catch (err) {
            console.error((err as Error).message);
            set({
                isLoading: false
            });
            throw err;
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
            throw err;
        }
    },

    edit: (property) => {
        
    },

    reset: () => set(init),
})));