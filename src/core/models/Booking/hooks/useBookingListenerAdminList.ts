import { useBookingsStore } from "@/src/core/models/Booking/stores/bookingStore";
import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect, useMemo } from "react";

export function useBookingListenerAdminList(passedBusinessOffers?: Offer[]) {
    const { businessId } = useAuthHook();

    const storeBusinessOffers = useOfferStore(s => s.businessOffers);
    const businessOffers = passedBusinessOffers ?? storeBusinessOffers;

    const bookingByOffer = useBookingsStore(s => s.bookingByOffer);
    const subscribeToBusinessBookings = useBookingsStore(s => s.subscribeToBusinessBookings);
    const unsubscribe = useBookingsStore(s => s.unsubscribeFromBusinessBookings);

    // Derive a stable sorted key of active offer IDs so useEffect only triggers when offer IDs change,
    // not every time reservedPax or other offer fields mutate.
    // Also include past hike dates so admins can view/manage bookings for all completed/active hikes.
    const activeOfferIdsKey = useMemo(() => {
        if (!businessOffers || businessOffers.length === 0) return '';

        return businessOffers
            .filter(offer => {
                const status = (offer.status || '').toLowerCase();
                return status !== 'cancelled' && status !== 'rescheduled';
            })
            .map(o => o.id)
            .sort()
            .join(',');
    }, [businessOffers]);

    useEffect(() => {
        if (!businessId || !activeOfferIdsKey) return;

        const offerIds = activeOfferIdsKey.split(',').filter(Boolean);

        offerIds.forEach(offerId => {
            subscribeToBusinessBookings(offerId, businessId).catch(err => {
                console.error((err as Error).message || `Failed to subscribe to bookings for offer ${offerId}`);
            });
        });

        return () => {
            offerIds.forEach(offerId => {
                unsubscribe(offerId);
            });
        };
    }, [businessId, activeOfferIdsKey, subscribeToBusinessBookings, unsubscribe]);

    return {
        bookingByOffer,
    };
}