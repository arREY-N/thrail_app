import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { useOfferAdminList } from "@/src/core/models/Offer/Offer";
import { useEffect, useState } from "react";

export function useBookingListenerAdminList() {
    const { businessId } = useAuthHook();

    const { businessOffers, isLoading, error } = useOfferAdminList();

    const subscribeToBusinessBookings = useBookingsStore(s => s.subscribeToBusinessBookings);
    const unsubscribe = useBookingsStore(s => s.unsubscribeFromBusinessBookings);

    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (!businessOffers || businessOffers.length === 0) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeOfferIds = businessOffers.filter(offer => {
            const status = (offer.status || '').toLowerCase();
            const offerDate = new Date(offer.date || offer.hikeDate || 0);
            offerDate.setHours(0, 0, 0, 0);

            const isUpcomingOrToday = offerDate >= today;
            return isUpcomingOrToday && status !== 'cancelled' && status !== 'rescheduled';
        }).map(o => o.id);

        activeOfferIds.forEach(offerId => {
            subscribeToBusinessBookings(offerId, businessId || '').catch(err => {
                setLocalError((err as Error).message || `Failed to subscribe to bookings for offer ${offerId}`);
            });
        });

        return () => {
            activeOfferIds.forEach(offerId => {
                unsubscribe(offerId);
            });
        };
    }, [businessId, businessOffers, subscribeToBusinessBookings, unsubscribe]);
}