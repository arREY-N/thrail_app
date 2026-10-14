import { Booking } from "@/src/core/models/Booking/interfaces/Booking.types";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";

export const getUserBookingItem = async (bookingId: string): Promise<Booking | null> => {
    await useBookingsStore.getState().loadById(bookingId);

    const bookingStore = useBookingsStore.getState();

    const allBookings = [
        ...bookingStore.userBookings,
        ...bookingStore.offerBookings,
        ...bookingStore.businessBookings,
        ...bookingStore.data
    ];

    console.log('allBookings:', allBookings);
    return allBookings.find(booking => booking.id === bookingId) || null;
};
