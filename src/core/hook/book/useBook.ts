import { IBaseDomainHook } from "@/src/core/interface/domainHookInterface";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useEffect } from "react";

export interface IBookDomain extends IBaseDomainHook{

}

export type UseBookParams = {
    userId?: string,
    bookingId?: string,
}

export default function useBook(params: UseBookParams = {}): IBookDomain {
    const { userId, bookingId } = params;

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