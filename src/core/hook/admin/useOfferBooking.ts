import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Offer } from "@/src/core/models/Offer/Offer";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export type UseOfferBookingParams = {
    offerId: string;
}

export default function useOfferBooking(params: UseOfferBookingParams) {
    const { offerId } = params;

    const { role } = useAuthHook();

    const subscribeToBusinessBookings = useBookingsStore(s => s.subscribeToBusinessBookings);
    const unsubscribe = useBookingsStore(s => s.unsubscribeFromBusinessBookings);

    const offerBookings = useBookingsStore(s => s.bookingByOffer[offerId]);
    const offers = useOffersStore(s => s.businessOffers);
    const isLoading = useBookingsStore(s => s.isLoading);
    
    const error = useBookingsStore(s => s.error);
    const [localError, setLocalError] = useState<string | null>(null);

    const [offer, setOffer] = useState<Offer | null>(() => {
        console.log('Offers in store:', offers);
        console.log('Looking for offer ID:', offerId);
        const found = offers.find(o => o.id === offerId);
        console.log('Found offer:', found); 
        return found || null;
    });


    useEffect(() => {
        let isCancelled = false;

        const startListening = async () => {
            try {
                subscribeToBusinessBookings(offerId);
                if (isCancelled) {
                    if(unsubscribe && offerId) 
                        unsubscribe(offerId);
                } else {
                    if(unsubscribe && offerId) {
                        unsubscribe(offerId);
                    }
                }
            } catch (err) {
                console.error("Failed to start listener", err);
                setLocalError(`Failed to load bookings. Please try again later. ${(err as Error).message}`);
            }
        }

        startListening();

        return () => {
            isCancelled = true;
            if(unsubscribe) 
                unsubscribe(offerId);
        }
    },[offerId, subscribeToBusinessBookings]);

    const onViewBooking = (bookingId: string, offerId: string) => {
        router.push({
            pathname: '/(main)/admin/booking/view',
            params: { bookingId, offerId }
        })
    }

    return {
        offerBookings,
        offer,
        error: error || localError,
        isLoading,
        onViewBooking
    }
}