import { Offer } from '@/src/core/models/Offer/interfaces/Offer.types';
import { useOfferStore } from '@/src/core/models/Offer/stores/offerStore';
// TYPES
export * from "@/src/core/models/Offer/interfaces/Offer.types";

export { OfferRepository } from "@/src/core/models/Offer/repositories/OfferRepository";

// FACTORY
export { createOffer, createOffer as newOffer } from "@/src/core/models/Offer/OfferFactory";


// REPOSITORY
export { OfferRepo } from "@/src/core/init/repositories";



// HOOKS 
export { useOfferItem } from '@/src/core/models/Offer/hooks/useOfferItem';
export { useOfferList } from "@/src/core/models/Offer/hooks/useOfferList";

// UTILITIES
export { updateOfferOnCancellation } from "@/src/core/models/Offer/utils/OfferUtilities";


// STORE ACCESS
export { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";

export const getBusinessOfferItem = async (offerId: string): Promise<Offer | null> => {
    await useOfferStore.getState().fetchOfferById(offerId);
    return useOfferStore.getState().data.find(offer => offer.id === offerId) || null;
}

export const getOffer = async (offerId: string): Promise<Offer | null> => {
    await useOfferStore.getState().fetchOfferById(offerId);
    return useOfferStore.getState().data.find(o => o.id === offerId) || null;
}