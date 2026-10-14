import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";

export function useBookingUserItem(bookingId?: string) {
    const booking = useBookingsStore(s => s.userBookings.find(b => b.id === bookingId) ?? null);

    return {
        booking
    }
}