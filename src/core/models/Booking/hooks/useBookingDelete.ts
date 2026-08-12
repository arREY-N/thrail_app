import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Booking } from "@/src/core/models/Booking/Booking";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useState } from "react";

export function useBookingDelete() {
    const { profile } = useAuthHook();

    const [localError, setLocalError] = useState<string | null>(null);
    const isDeleting = useBookingsStore(s => s.isWriting);    
    const deleteBooking = useBookingsStore(s => s.deleteBooking);

    const cancelReservation = async (booking: Booking) => {
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
        cancelReservation,
    }
}