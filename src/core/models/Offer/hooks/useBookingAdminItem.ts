import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore.native";

export function useBookingAdminItem(bookingId: string) {
    const booking = useBookingsStore(s => s.businessBookings.find(b => b.id === bookingId));
    const offerBookings = useBookingsStore(s => s.bookingByOffer[booking?.offer.id || '']);
    return {
        booking,
        offerBookings
    } 
}