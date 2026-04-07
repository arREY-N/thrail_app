import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
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

    const fetchOfferBookings = useBookingsStore(s => s.fetchOfferBookings);

    const offerBookings = useBookingsStore(s => s.offerBookings);
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
    const [booking, setBooking] = useState<Booking | null>(() => {
        let found = null;

        found = offerBookings.find(b => b.id === offerId);

        if(!found) {
            console.log('No booking found in offerBookings, checking userBookings');
            return null;
        }

        console.log('Found booking:', found);
        return found;
    });

    useEffect(() => {
        if(!offerId) {
            console.log('error no offer id');
            setLocalError('No offer ID provided');
            return;
        };  

        if(!role) {
            console.log('error no role found');
            setLocalError('No user role found');
            return;
        };

        console.log('Fetching bookings for offer ID:', offerId, 'with role:', role);
        fetchOfferBookings(offerId, role);
    },[offerId]);

    const onViewBooking = (bookingId: string, offerId: string) => {
        router.push({
            pathname: '/(main)/admin/booking/view',
            params: { bookingId, offerId }
        })
    }

    return {
        offerBookings,
        offer,
        booking,
        error: error || localError,
        isLoading,
        onViewBooking
    }
}