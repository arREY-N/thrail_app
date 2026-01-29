import { create } from "zustand";
import {
    createNewOffer,
    deleteOffer,
    fetchOfferForTrail,
    fetchOffers
} from "../repositories/offerRepository";

const OFFER_TEMPLATE = {
    general: {
        date: null,
        price: null,
        description: null,
        documents: []
    },
    hike: {
        trail: null,
        duration: null,
        inclusions: [],
    },
}

const init = {
    offers: [],
    isLoading: false,
    error: null,
    trailOffers: null,
    documents: [],
    offer: OFFER_TEMPLATE,
}

export const useOffersStore = create((set, get) => ({
    ...init, 

    includeInclusions: (doc) => {
        set((state) => {
            const updated = state.offer.inclusions?.find(i => i === doc)
                ? state.offer.inclusions?.filter(i => i !== doc)
                : [...state.offer.inclusions ?? null, doc];

            return {
                offer: {
                    ...state.offer,
                    inclusions: updated
                }
            }
        })
    },

    includeDocument: (doc) => {        
        set((state) => {
            const updated = state.offer.documents?.find(d => d === doc)
                ? state.offer.documents?.filter(d => d !== doc)
                : [...state.offer.documents ?? null, doc];

            return {
                offer: { 
                    ...state.offer, 
                    documents: updated 
                } 
            }
        });
    },

    editProperty: (property) => {
        const { info, type, key, value } = property;
        const offer = get().offer;
        
        let current = (offer[info] && offer[info][key]) ? offer[info][key] : null;
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
                    [info]: {
                        ...state.offer[info],
                        [key]: finalValue
                    }
                }
            }
        })
    },

    editOffer: (data) => {
        set((state) => {
            return {
                offer: { ...state.offer, ...data }
            }
        })
    },

    reset: () => set(init),

    resetOffer: () => set({ offer: OFFER_TEMPLATE }),

    loadOffers: async (businessId) => {
        const { offers } = get();

        const isSameBusiness = offers.length > 0 && offers[0].businessId === businessId

        if(isSameBusiness) return;

        console.log('Fetching for ', businessId)
        set({ isLoading: true, error: null });

        try {
            
            const offers = await fetchOffers(businessId);
            set({offers, isLoading: false})
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load offers',
                isLoading: false
            });
        }
    },

    writeOffer: (id) => {
        set({ isLoading: true, error: null});

        try {
            if(get().offers.length > 0 && get().offers.find(o => o.id === id)){
                set({
                    offer: get().offers.find(o => o.id === id),
                    isLoading: false, 
                })
                return;
            }
            
            set({
                offer: OFFER_TEMPLATE,
                isLoading: false,
            })
        } catch (err) {
            set({
                error: err.message || 'Failed writing offer',
                isLoading: false
            })
        }
    },

    refreshOffers: async () => {
        set({isLoading: true, error: null});

        try {
            const offers = await fetchOffers();
            set({offers, isLoading: false});
        } catch (err) {
            set({
                error: err.message ?? 'Failed to load offers',
                isLoading: false
            });
        }
    },

    addOffer: async (business) => {
        set({isLoading: true, error: null});

        try {
            const businessInformation = {
                businessId: business.id,
                businessName: business.businessName
            }

            const newOffer = await createNewOffer({
                ...get().offer,
                ...businessInformation
            });

            console.log(newOffer)
            
            const optimisticOffer = {
                ...newOffer,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            set(state => {
                const newOfferList = state.offers.filter(o => o.id !== optimisticOffer.id);
                return {
                    offers: [...newOfferList, optimisticOffer],
                    isLoading: false
                }
            });
        } catch (err) {
            set({
                error: err.message ?? 'Failed to create new offer',
                isLoading: false
            })
        }
    },

    loadTrailOffers: async (trailId) => {
        try{
            if(!trailId)
                throw new Error('Trail ID missing');

            if(get().trailOffers?.length > 0 && get().trailOffers[0]?.trail.id === trailId) return;
            
            set({isLoading: true, error: null});
            
            const offers = await fetchOfferForTrail(trailId);

            if(offers.length === 0){
                set({
                    error: 'No offers available for this trail',
                    trailOffers: [],
                    isLoading: false
                })
                return;
            }

            set({
                trailOffers: offers,
                isLoading: false,
            })
        } catch (err) {
            set({
                error: err.message ?? 'Failed loading trail offers',
                isLoading: false
            })
        }
    },

    deleteOffer: async (offerId, businessId) => {
        set({isLoading: true, error: null});

        try {
            if(!offerId || !businessId){
                console.log(`${offerId}, ${businessId}`);
                throw new Error('Offer and Business ID missing');
            }

            console.log('Here', offerId, ' + ', businessId);
            const deletedId = await deleteOffer(offerId, businessId)
            console.log('Deleted', deletedId, ' + ', businessId);

            set((state) => {
                return {
                    offers: state.offers.filter(o => o.id !== offerId),
                    isLoading: false,
                }
            })
        } catch (err) {
            set({
                error: err.message ?? 'Failed deleting offer',
                isLoading: false
            })
        }
    },

    updateOffer: (id) => {
        set({ isLoading: true, error: null });

        try {
            const offer = get().offers.find(o => o.id === id);
    
            if(!offer) {
                set({
                    error: 'No offer found',
                    isLoading: false
                })
                return;
            }

            set({
                offer: offer,
                isLoading: false
            })
        } catch (err) {
            set({
                error: err.message || 'Failed selecting offer',
                isLoading: false
            })
        }
        
    }
}))