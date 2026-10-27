import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";


export function useBookingOfferAdminList(offerId: string) {
    const offerBookings = useBookingsStore(s => s.bookingByOffer[offerId]);
    const error = useBookingsStore(s => s.error);
    const { businessId } = useAuthHook();

    useEffect(() => {
        if (!offerId) {
            console.error("Offer ID is required for subscribing to business bookings");
            return;
        }

        if (!businessId) {
            console.error("Business ID is required for subscribing to business bookings");
            return;
        }

        useBookingsStore.getState().subscribeToBusinessBookings(offerId, businessId);

        return () => {
            useBookingsStore.getState().unsubscribeFromBusinessBookings(offerId);
        };
    }, [businessId, offerId]);

    const onViewBooking = useCallback((bookingId: string, offerId: string) => {
        router.push({
            pathname: '/(app)/(main)/admin/booking/view',
            params: { bookingId, offerId }
        });
    }, []);

    return {
        offerBookings,
        onViewBooking,
        error,
    }
}