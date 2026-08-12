import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { router } from "expo-router";
import { useEffect } from "react";


export function useBookingAdminList(offerId: string) {
    const offerBookings = useBookingsStore(s => s.bookingByOffer[offerId]);
    const error = useBookingsStore(s => s.error);
    const { businessId } = useAuthHook();

    useEffect(() => {
        if(!offerId) {
            console.error("Offer ID is required for subscribing to business bookings");
            return;
        }
        
        if(!businessId) {
            console.error("Business ID is required for subscribing to business bookings");
            return;
        }
        useBookingsStore.getState().subscribeToBusinessBookings(offerId, businessId);
    },[offerId]);

    const onViewBooking = (bookingId: string, offerId: string) => {
        router.push({
            pathname: '/(main)/admin/booking/view',
            params: { bookingId, offerId }
        })
    }
    
    return {
        offerBookings,
        onViewBooking,
        error, 
    }
}