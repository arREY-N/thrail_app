import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { useCallback, useEffect } from "react";

export function useOfferList() {
    const offers = useOfferStore(s => s.data);
    const isFetching = useOfferStore(s => s.isFetching);
    const error = useOfferStore(s => s.error);
    const isLoading = useOfferStore(s => s.isLoading)

    useEffect(() => {
        const fetch = async () => {
            await useOfferStore.getState().fetchAll();
        }

        fetch();
    }, [])

    const onRefreshOffers = useCallback(async () => {
        await useOfferStore.getState().fetchAll();
    }, []);

    return {
        offers,
        isFetching,
        error,
        isLoading,
        onRefreshOffers
    };
}