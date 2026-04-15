import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useEffect } from "react";

export type UseBookParams = {
    userId?: string,
    bookingId?: string,
}

export default function useBook(params: UseBookParams = {}) {
    const { userId } = params;

    const isLoading = useBookingsStore(s => s.isLoading);
    const error = useBookingsStore(s => s.error);
    const loadUserBookings = useBookingsStore(s => s.load);
    
    useEffect(() => {
        if(userId) loadUserBookings(userId)
    },[userId])

    return {
        isLoading,
        error,
    }
}