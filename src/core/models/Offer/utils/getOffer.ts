import { Offer } from "@/src/core/models/Offer/interfaces/Offer.types";
import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";

export const getBusinessOfferItem = async (offerId: string): Promise<Offer | null> => {
    await useOfferStore.getState().fetchOfferById(offerId);
    return useOfferStore.getState().data.find(offer => offer.id === offerId) || null;
};

export const getOffer = async (offerId: string): Promise<Offer | null> => {
    await useOfferStore.getState().fetchOfferById(offerId);
    return useOfferStore.getState().data.find(o => o.id === offerId) || null;
};
