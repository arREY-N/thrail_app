import { create } from "zustand";
import { createNewOffer, deleteOffer, fetchOfferById, fetchOfferForTrail, fetchOffers } from "../repositories/offerRepository";

const init = {
    offers: [],
    isLoading: false,
    error: null,
    trailOffers: null,
}

export const useOffersStore = create((set, get) => ({
    ...init, 

    reset: () => set(init),

    loadOffers: async (businessId) => {
        const { offers } = get();

        const isSameBusiness = offers.length > 0 && offers[0].ownedBy === businessId

        if(isSameBusiness) return;

        console.log('Fetching for ', businessId)
        set({isLoading: true, error: null});

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

    loadOffer: async (offerData) => {
        set({isLoading: true, error: null});

        if(get().offers.length > 0 && get().offers.some(o => o.id === offerData.id))
            return get().offers.some(o => o.id === id);

        try {
            const businessId = offerData.ownedBy;
            const trailId = offerData.trailId;

            const offer = await fetchOfferById(businessId, trailId);

            if(!offer){
                console.log(`Offer ${offerData.id} from ${businessId} for ${trailId} not found`);
                set({
                    error: 'Offer not found',
                    isLoading: false
                })
                return;
            }

            set((state) => {
                return{ 
                    offers: [...state, offer],
                    isLoading: false
                }
            });
        } catch (err) {
            set({
                error: err.message ?? 'Failed loading details for offer',
                isLoading: false,
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

    addOffer: async (offerData) => {
        set({isLoading: true, error: null});

        try {
            const newOffer = await createNewOffer(offerData);
            
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
            
            if(get().trailOffers?.length > 0 && get().trailOffers[0]?.trailId === trailId) return;
            
            set({isLoading: true, error: null});
            
            const offers = await fetchOfferForTrail(trailId);

            if(offers.length === 0){
                console.log('No offers available for this trail');
                set({
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
    }
}))