import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useEffect } from "react";

export function useBookingUserList() {
    const { profile } = useAuthHook();

    const bookings = useBookingsStore(s => s.userBookings);
    const subscriptionError = useBookingsStore(s => s.subscriptionError);
    
    useEffect(() => {
        if(!profile || !profile.id) return;

        const unsubscribe = useBookingsStore.getState().subscribeToUserBookings(profile.id);
        
        return () => unsubscribe();
    }, [profile?.id]);

    return {
        bookings,
        subscriptionError
    };
}