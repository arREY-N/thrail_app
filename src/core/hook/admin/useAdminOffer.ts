import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useOfferStore } from "@/src/core/models/Offer/Offer";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function useAdminOffer() {
    const { businessId } = useAuthHook();

    const loadBusinessOffers = useOfferStore(s => s.fetchOfferByBusiness);
    const businessOffers = useOfferStore(s => s.businessOffers);
    const subscribeToBusinessBookings = useBookingsStore(s => s.subscribeToBusinessBookings);
    const unsubscribe = useBookingsStore(s => s.unsubscribeFromBusinessBookings);

    const [localError, setLocalError] = useState<string | null>(null);

    // Load business offers when the component mounts or when the businessId changes
    useEffect(() => {
        if (businessId && (!businessOffers || businessOffers.length === 0)) {
            loadBusinessOffers(businessId).catch(err => {
                console.error("Failed to load business offers: ", err);
                setLocalError((err as Error).message || "Failed to load offers");
            });
        }
    }, [businessId, loadBusinessOffers, businessOffers]);

    useEffect(() => {
        if (!businessOffers || businessOffers.length === 0) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Filter ONLY the Active Offers (Ignore past, cancelled, or rescheduled)
        const activeOfferIds = businessOffers.filter(offer => {
            const status = (offer.status || '').toLowerCase();
            const offerDate = new Date(offer.date || offer.hikeDate || 0);
            offerDate.setHours(0, 0, 0, 0);

            const isUpcomingOrToday = offerDate >= today;
            return isUpcomingOrToday && status !== 'cancelled' && status !== 'rescheduled';
        }).map(o => o.id);

        // 2. Attach real-time listeners ONLY to those active offers
        activeOfferIds.forEach(offerId => {
            subscribeToBusinessBookings(offerId, businessId || '').catch(err => {
                console.error(`Failed to subscribe to bookings for offer ${offerId}: `, err);
                setLocalError((err as Error).message || `Failed to subscribe to bookings for offer ${offerId}`);
            });
        });

        // 3. CLEANUP: When the Admin leaves the list screen, kill the listeners to save memory/data!
        return () => {
            activeOfferIds.forEach(offerId => {
                unsubscribe(offerId);
            });
        };
    }, [businessOffers, subscribeToBusinessBookings, unsubscribe]);

    const onViewOfferBookings = (offerId: string) => {
        router.push({
            pathname: '/(main)/admin/offer/view',
            params: { offerId }
        });
    }

    return {
        isLoading: useOfferStore(s => s.isLoading),
        error: useOfferStore(s => s.error) || localError,
        businessOffers,
        onViewOfferBookings
    }
}