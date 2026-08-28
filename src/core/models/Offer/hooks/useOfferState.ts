import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";

export function useOfferState() {
    const error = useOfferStore(s => s.error);
    const isLoading = useOfferStore(s => s.isLoading);

    return {
        error,
        isLoading,
    }
}