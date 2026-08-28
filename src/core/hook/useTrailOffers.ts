import { useOfferList } from "@/src/core/models/Offer/Offer";
import { useTrailList } from "@/src/core/models/Trail/Trail";
import { useMemo } from "react";

export function useTrailOffers() {
    const { trails, isLoading: trailIsLoading } = useTrailList();

    const { offers, isLoading: offerIsLoading } = useOfferList();

    const isLoading = useMemo(() => {
        return trailIsLoading || offerIsLoading;
    }, [trailIsLoading, offerIsLoading]);

    const trailsWithOffers = useMemo(() => {
        const now = new Date();
        const upcomingOffers = offers.filter(o => o.date && new Date(o.date).getTime() > now.getTime());
        const trailIds = upcomingOffers.map(o => o.trail?.id).filter(Boolean);
        const uniqueIds = Array.from(new Set(trailIds));
        return trails.filter(t => uniqueIds.includes(t.id));
    }, [trails, offers]);

    return {
        trailsWithOffers,
        offers,
        trails,
        isLoading,
    }
}