import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { useEffect } from "react";

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

    return {
        offers,
        isFetching,
        error,
        isLoading
    };
}