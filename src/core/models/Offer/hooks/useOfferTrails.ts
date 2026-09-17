import { useOfferState } from "@/src/core/models/Offer/hooks/useOfferState";
import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { useEffect } from "react";

export function useOfferTrails(trailId: string) {
    const trailOffers = useOfferStore(s => s.trailOffers);
    const { error, isLoading } = useOfferState();

    useEffect(() => {
        const fetch = async () => {
            await useOfferStore.getState().fetchOfferByTrail(trailId)
        }

        fetch();
    }, [trailId])

    return {
        trailOffers,
        error,
        isLoading
    }
}