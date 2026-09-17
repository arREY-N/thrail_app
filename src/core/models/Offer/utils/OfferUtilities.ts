import { Booking } from "@/src/core/models/Booking/Booking";
import { Offer } from "@/src/core/models/Offer/interfaces/Offer.types";

export const updateOfferOnCancellation = (offer: Offer, originalBooking: Booking): Offer => {
    
    if(offer.reservedPax <= 0 && originalBooking.status !== 'for-reservation') {
        throw new Error("Illegal cancellation due to reservedPax being less than or equal to zero.");
    }

    const updatedOffer: Offer = {
        ...offer,
        updatedAt: new Date(),
        reservedPax: originalBooking.status === 'for-reservation' 
            ? offer.reservedPax 
            : offer.reservedPax - 1,
    }

    return updatedOffer;
}