import { Offer } from "@/src/core/models/Offer/Offer";

export const updateOfferOnCancellation = (offer: Offer): Offer => {
    if(offer.reservedPax <= 0) {
        throw new Error("Illegal cancellation due to reservedPax being less than or equal to zero.");
    }

    const updatedOffer: Offer = {
        ...offer,
        updatedAt: new Date(),
        reservedPax: offer.reservedPax - 1,
    }

    return updatedOffer;
}