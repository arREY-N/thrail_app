import { useOfferList } from "@/src/core/models/Offer/Offer";
import { useTrailList } from "@/src/core/models/Trail/Trail";
import { getTrailsWithAliveOffers } from "@/src/utils/offerHelpers";
import { useMemo } from "react";

export function useTrailOffers() {
    const { trails, trailLoading } = useTrailList();

    const { offers, isLoading: offerIsLoading } = useOfferList();

    const trailOfferIsLoading = useMemo(() => {
        return trailLoading || offerIsLoading;
    }, [trailLoading, offerIsLoading]);

    const trailsWithOffers = useMemo(() => {
        return getTrailsWithAliveOffers(trails, offers);
    }, [trails, offers]);

    return {
        trailsWithOffers,
        offers,
        trails,
        trailOfferIsLoading,
    }
}
