import { create } from "zustand";
import {
    createNewOffer,
    deleteOffer,
    fetchOfferForTrail,
    fetchOffers
} from "../repositories/offerRepository";

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
    offers: [],
    isLoading: false,
    error: null,
    documents: [],
    offer: null,
    sort: null,
}

export const useOffersStore = create((set, get) => ({
    ...init, 

    addOffer: async (businessData) => {
        set({isLoading: true, error: null});

        try {
            const business = {
                id: businessData.id,
                name: businessData.businessName
            }
        
            const newOffer = await createNewOffer({ ...get().offer, business });
            
            console.log(newOffer);

            const optimisticOffer = {
                ...newOffer,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            set(state => {
                const newOfferList = state.offers.filter(o => o.id !== optimisticOffer.id);
                const offers = [optimisticOffer, ...newOfferList];
                const sorted = offers.sort((a, b) => a.date - b.date);
                
                return {
                    offers: sorted,
                    isLoading: false
                }
            });
            
            return optimisticOffer.id;
        } catch (err) {
            console.log(err.message);
            set({
                error: err.message ?? 'Failed to create new offer',
                isLoading: false
            })
        }
    },

    writeOffer: (id) => {
        if(!id) {
            set({ offer: OFFER_TEMPLATE }); 
            return;
        }

        set({ isLoading: true, error: null});

        try {
            set({
                offer: get().offers.find(o => o.id === id),
                isLoading: false, 
            })
        } catch (err) {
            console.log(err.message);
            set({
                error: err.message || 'Failed writing offer',
                isLoading: false
            })
        }
    },
    
    editProperty: (property) => {
        const { type, key, value } = property;
        const offer = get().offer;

        let current = (offer[key]) ? offer[key] : null;
        let finalValue = value;
        
        if(type === 'multi-select'){
            current = current || [];
            finalValue = current?.find(v => v === value)
                ? current.filter(c => c !== value)
                : [...current, value]
        } else if (type ===  'boolean'){
            finalValue = !current
        } 

        set((state) => {
            return {
                offer: {
                    ...state.offer,
                    [key]: finalValue,
                }
            }
        })
    },

    reset: () => set(init),

    resetOffer: () => set({ offer: null }),

    refreshOffers: async () => {
        set({isLoading: true, error: null});

        try {
            const offers = await fetchOffers();
            set({offers, isLoading: false});
        } catch (err) {
            console.log(err.message);
            set({
                error: err.message ?? 'Failed to load offers',
                isLoading: false
            });
        }
    },

    loadBusinessOffers: async (businessId) => {
        const { offers } = get();

        if(offers.length > 0 && offers[0].businessId === businessId) return;
        
        set({ isLoading: true, error: null });

        try {
            const offers = await fetchOffers(businessId);
            console.log(offers);
            set({offers, isLoading: false})
        } catch (err) {
            console.log(err.message);
            set({
                error: err.message ?? 'Failed to load offers',
                isLoading: false
            });
        }
    },

    loadTrailOffers: async (trailId) => {
        const { offers } = get().offers;

        if(offers && offers.length > 0 && offers[0].hike.trail.id === trailId) return;
        
        try{
            if(!trailId)
                throw new Error('Trail ID missing');
                
            set({ isLoading: true, error: null });
            
            const fetched = await fetchOfferForTrail(trailId);
            
            set({
                offers: fetched || [],
                isLoading: false,
            })
        } catch (err) {
            console.log(err.message);
            set({
                error: err.message ?? 'Failed loading trail offers',
                isLoading: false
            })
        }
    },

    loadOffer: (offerId) => {
        set({ isLoading: true, error: null})
        
        try {
            const offer = get().offers.find(o => o.id === offerId);

            if(!offer) throw new Error('Offer not found');

            console.log(offer);

            set({
                offer,
                isLoading: false
            })
        } catch (err) {
            console.error(err.message)
            set({
                error: err.message || 'Failed loading offer',
                isLoading: false
            })
        }
    },

    deleteOffer: async (offerId, businessId) => {
        set({isLoading: true, error: null});

        try {
            if(!offerId || !businessId){
                throw new Error('Offer and Business ID missing');
            }

            const deletedId = await deleteOffer(offerId, businessId)
            
            set((state) => {
                return {
                    offers: state.offers.filter(o => o.id !== deletedId),
                    isLoading: false,
                }
            })
        } catch (err) {
            console.log(err.message);
            set({
                error: err.message ?? 'Failed deleting offer',
                isLoading: false
            })
        }
    },
}))