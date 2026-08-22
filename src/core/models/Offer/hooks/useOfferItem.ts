import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { useEffect } from "react";

export function useOfferItem(offerId: string) {
    const offer = useOfferStore(s => s.businessOffers.find(o => o.id === offerId) || null);

    useEffect(() => {
        if(!offerId) return;
        const fetch = async () => {
            await useOfferStore.getState().fetchOfferById(offerId);
        };
        fetch();
    }, [offerId]);

    return {
        offer,
    }
}