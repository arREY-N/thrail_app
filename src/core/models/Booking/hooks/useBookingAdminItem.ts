import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useEffect } from "react";

export function useBookingAdminItem(bookingId: string, offerId: string) {
    const { businessId } = useAuthHook();

    const bookingsByOffer = useBookingsStore(s => s.bookingByOffer[offerId]);
    const booking = bookingsByOffer?.find(b => b.id === bookingId);
    const isFetching = useBookingsStore(s => s.isFetching)
    const offerBookings = useBookingsStore(s => s.bookingByOffer[booking?.offer.id || '']);

    useEffect(() => {
        if (!businessId || !offerId) return;
        useBookingsStore.getState().subscribeToBusinessBookings(offerId, businessId)
    }, [offerId, businessId])

    return {
        booking,
        offerBookings,
        isFetching,
    }
}