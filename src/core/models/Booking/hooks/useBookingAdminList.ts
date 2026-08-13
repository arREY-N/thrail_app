import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useEffect } from "react";

export function useBookingAdminList() {
    const { businessId } = useAuthHook();
    
    const error = useBookingsStore(s => s.error);
    const businessBookings = useBookingsStore(s => s.businessBookings);
    const isFetching = useBookingsStore(s => s.isFetching);

    useEffect(() => {
        const fetch = async () => {
            if(!businessId) return;
        
            await useBookingsStore.getState().fetchAllBusinessBookings(businessId);
        }

        fetch();
    }, [businessId])

    return {
        businessBookings,
        isFetching,
        error,
    }
}