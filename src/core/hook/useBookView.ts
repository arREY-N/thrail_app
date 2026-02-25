import { useAuthStore } from "@/src/core/stores/authStore";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { usePaymentsStore } from "@/src/core/stores/paymentsStore";
import { OfferUI } from "@/src/types/entities/Offer";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export type BookParams = {
    offerId: string | null;
}

export function useBookView(params: BookParams){
    const { offerId } = params;

    const systemOffers = useOffersStore(s => s.error);
    const systemPayments = usePaymentsStore(s => s.error);
    const systemBookings = useBookingsStore(s => s.error);

    const router = useRouter();    
    const profile = useAuthStore(s => s.profile);

    const loadOffer = useOffersStore(s => s.load);
    const offer = useOffersStore(s => s.current);

    const createPayment = usePaymentsStore(s => s.create);
    const paymentIsLoading = usePaymentsStore(s => s.isLoading);
    
    const createBooking = useBookingsStore(s => s.createBooking);
    const bookingIsLoading = useBookingsStore(s => s.isLoading);

    const [mode, setMode] = useState('');
    const modes = ['GCash', 'Maya'];

    const userBookings = useBookingsStore(s => s.userBookings);
    const bookingErrors = useBookingsStore(s => s.error);
    const cancelBooking = useBookingsStore(s => s.cancelBooking);
    
    useEffect(() => {
        console.log('loading: ', offerId);
        loadOffer({ id: offerId })
    }, [offerId]);

    function onCancelBookingPress(bookingData: OfferUI){
        try {
            if(!profile) throw new Error('Profile is empty');

            cancelBooking({
                cancelledBy: profile.role,
                bookingData
            });
        } catch (err) {
            console.log((err as Error).message);
        }
    }

    const onPayPress = async (mode: string) => {
        const payment = await createPayment({
            profile,
            offer,
            mode
        })

        if(!payment) return;

        await createBooking({
            bookingData: {
                payment: 
                offer
            },
        });

        // router.push({
        //     pathname: '/receipt/view',
        //     params: { paymentId: payment.id }
        // });
    }

    console.log(offer);

    return {
        offer,
        mode,
        setMode,
        modes,
        onPayPress,
        paymentIsLoading,
        bookingIsLoading,
        systemBookings,
        systemOffers,
        systemPayments, 
        profile,
        userBookings,
        bookingErrors,
        onCancelBookingPress
    }
}