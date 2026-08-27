import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/interfaces/Booking.types";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useState } from "react";

export function useBookingDelete() {
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);
    const isDeleting = useBookingsStore(s => s.isWriting);    
    const deleteBooking = useBookingsStore(s => s.deleteBooking);

    /**
     * Function to cancel a booking with a pending status.
     * Deletes the whole reservation immediately, no approval needed from 
     * the admin or business. Only works for bookings that have not been 
     * approved yet.
     * @param {Booking} booking - The booking to cancel
     */
    const cancelPendingBooking = async (booking: Booking) => {
        try {
            setLocalError(null);
        
            if(!profile) 
                throw new Error("User profile is not available.");

            if(profile.role !== "user" && (booking.user.id !== profile.id)) {
                throw new Error("Only users can cancel reservations.");
            }

            if(profile.id !== booking.user.id) {
                throw new Error("You can only cancel your own reservations.");
            }

            await deleteBooking(booking.id);
        } catch (error) {
            console.log("Error canceling reservation:", error);
            setLocalError(`Error canceling reservation. Details: ${(error as Error).message}`);    
        }
    }

    return {
        error: localError,
        isDeleting,
        cancelPendingBooking,
    }
}