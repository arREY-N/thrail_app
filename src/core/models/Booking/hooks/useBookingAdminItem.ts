import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export function useBookingAdminItem(bookingId: string, offerId: string) {
    const { businessId } = useAuthHook();

    const bookingsByOffer = useBookingsStore(s => s.bookingByOffer[offerId]);
    const booking = bookingsByOffer?.find(b => b.id === bookingId);
    const isFetching = useBookingsStore(s => s.isFetching)
    const offerBookings = useBookingsStore(s => s.bookingByOffer[booking?.offer.id || '']);

    useEffect(() => {
        const fetch = async () => {
            if (!businessId || !offerId) return;
            useBookingsStore.getState().subscribeToBusinessBookings(offerId, businessId)
        }

        fetch();
    }, [offerId, businessId])

    return {
        booking,
        offerBookings,
        isFetching,
    }
}