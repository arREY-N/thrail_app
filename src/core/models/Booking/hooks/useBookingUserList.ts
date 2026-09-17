import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export function useBookingUserList() {
    const { profile } = useAuthHook();

    const bookings = useBookingsStore(s => s.userBookings);
    const subscriptionError = useBookingsStore(s => s.subscriptionError);
    const isFetching = useBookingsStore(s => s.isFetching);

    useEffect(() => {
        if (!profile?.id) return;

        const unsubscribe = useBookingsStore.getState().subscribeToUserBookings(profile.id);

        return () => unsubscribe();
    }, [profile?.id]);

    return {
        bookings,
        subscriptionError,
        isFetching
    };
}