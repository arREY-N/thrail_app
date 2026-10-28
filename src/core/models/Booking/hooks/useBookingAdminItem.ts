import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export function useBookingAdminItem(bookingId: string, offerId: string) {
    const { businessId } = useAuthHook();

    const bookingsByOffer = useBookingsStore(s => s.bookingByOffer[offerId]);
    const booking = bookingsByOffer?.find(b => b.id === bookingId);
    const isFetching = useBookingsStore(s => s.isFetching);

    useEffect(() => {
        if (!businessId || !offerId) return;

        useBookingsStore.getState().subscribeToBusinessBookings(offerId, businessId);

        return () => {
            useBookingsStore.getState().unsubscribeFromBusinessBookings(offerId);
        };
    }, [offerId, businessId]);

    return {
        booking,
        isFetching,
    };
}