import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { useCallback, useEffect } from "react";

export function useOfferItem(offerId?: string) {
    const offer = useOfferStore(s => s.businessOffers.find(o => o.id === offerId) || null);

    useEffect(() => {
        if (!offerId) return;
        const fetch = async () => {
            await useOfferStore.getState().fetchOfferById(offerId);
        };
        fetch();
    }, [offerId]);

    const onRefreshItem = useCallback(async (offerId: string) => {
        await useOfferStore.getState().fetchOfferById(offerId);
    }, [])

    return {
        offer,
        onRefreshItem
    }
}