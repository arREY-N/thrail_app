import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore.web";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { usePaymentsStore } from "@/src/core/stores/paymentsStore";
import { useEffect, useState } from "react";

export type BookParams = {
    offerId: string | null;
}

export function useBookView(params: BookParams){
    const { offerId } = params;

    const systemOffers = useOfferStore(s => s.error);
    const systemPayments = usePaymentsStore(s => s.error);
    const systemBookings = useBookingsStore(s => s.error);

    const profile = useAuthStore(s => s.profile);

    const loadOffer = useOfferStore(s => s.fetchOfferById);
    const offer = useOfferStore(s => s.current);

    const paymentIsLoading = usePaymentsStore(s => s.isLoading);
    
    const bookingIsLoading = useBookingsStore(s => s.isLoading);

    const [mode, setMode] = useState('');
    const modes = ['GCash', 'Maya'];

    const userBookings = useBookingsStore(s => s.userBookings);
    const bookingErrors = useBookingsStore(s => s.error);
    
    useEffect(() => {
        console.log('loading: ', offerId);
        if(!offerId) return;
        loadOffer(offerId);
    }, [offerId]);

    return {
        offer,
        mode,
        setMode,
        modes,
        paymentIsLoading,
        bookingIsLoading,
        systemBookings,
        systemOffers,
        systemPayments, 
        profile,
        userBookings,
        bookingErrors,
    }
}