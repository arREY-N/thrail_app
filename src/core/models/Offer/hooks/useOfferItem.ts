import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { useCallback, useEffect } from "react";

export function useOfferItem(offerId?: string) {
    const offer = useOfferStore(s => s.data.find(o => o.id === offerId) || null);

    useEffect(() => {
        if (!offerId) return;
        const fetch = async () => {
            try {
                await useOfferStore.getState().fetchOfferById(offerId);
            } catch (error) {

            }
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