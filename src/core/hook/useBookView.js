import { useAuthStore } from "@/src/core/stores/authStore";
import useBookingsStore from "@/src/core/stores/bookingsStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { usePaymentsStore } from "@/src/core/stores/paymentsStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";


export function useBookView({
    offerId = null,
}){
    const systemOffers = useOffersStore(s => s.error);
    const systemPayments = usePaymentsStore(s => s.error);
    const systemBookings = useBookingsStore(s => s.error);

    const router = useRouter();    
    const profile = useAuthStore(s => s.profile);

    const loadOffer = useOffersStore(s => s.loadOffer);
    const offer = useOffersStore(s => s.offer);

    const createPayment = usePaymentsStore(s => s.createPayment);
    const paymentIsLoading = usePaymentsStore(s => s.isLoading);
    
    const createBooking = useBookingsStore(s => s.createBooking);
    const bookingIsLoading = useBookingsStore(s => s.isLoading);

    const [mode, setMode] = useState('');
    const modes = ['GCash', 'Maya'];

    const userBookings = useBookingsStore(s => s.userBookings);
    const bookingErrors = useBookingsStore(s => s.error);
    const cancelBooking = useBookingsStore(s => s.cancelBooking);
    
    useEffect(() => {
        if(offerId) loadOffer(offerId)
    }, [offerId]);

    const onCancelBookingPress = (bookingData) => {
        try {
            cancelBooking({
                cancelledBy: profile.role,
                bookingData
            });
        } catch (err) {
            console.log(err.message);
        }
    }

    const onPayPress = async (mode) => {
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

        router.push({
            pathname: '/receipt/view',
            params: { paymentId: payment.id }
        });
    }

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