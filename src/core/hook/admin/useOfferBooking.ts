import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export type UseOfferBookingParams = {
    offerId: string;
}

// TODO
// Aug 12, 2026
// No usage, for deletion

export default function useOfferBooking(params: UseOfferBookingParams) {
    const { offerId } = params;

    const subscribeToBusinessBookings = useBookingsStore(s => s.subscribeToBusinessBookings);
    const unsubscribe = useBookingsStore(s => s.unsubscribeFromBusinessBookings);

    const offerBookings = useBookingsStore(s => s.bookingByOffer[offerId]);

    const isLoading = useBookingsStore(s => s.isLoading);
    
    const error = useBookingsStore(s => s.error);
    const [localError, setLocalError] = useState<string | null>(null);

    const offer = offerBookings.find(b => b.offer.id === offerId)?.offer || null;

    useEffect(() => {
        let isCancelled = false;

        const startListening = async () => {
            try {
                subscribeToBusinessBookings(offerId);
                if (isCancelled && unsubscribe && offerId) {
                    unsubscribe(offerId);
                }
            } catch (err) {
                console.error("Failed to start listener", err);
                setLocalError(`Failed to load bookings. Please try again later. ${(err as Error).message}`);
            }
        }

        startListening();

        return () => {
            isCancelled = true;
            if (unsubscribe) {
                unsubscribe(offerId);
            }
        }
    }, [offerId, subscribeToBusinessBookings]);

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