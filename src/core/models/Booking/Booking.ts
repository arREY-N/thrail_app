import { Booking } from "@/src/core/models/Booking/interfaces/IBooking";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";

// TYPES
export * from "@/src/core/models/Booking/interfaces/IBooking";

// FACTORY
export { createBooking } from "@/src/core/models/Booking/BookingFactory";

// STORES
export { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";

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
}

// UTILS
export { updateBookingOnCancellation } from "@/src/core/models/Booking/utils/Booking.utils";

// HOOKE
export { useBookingDelete } from "@/src/core/models/Booking/hooks/useBookingDelete";

