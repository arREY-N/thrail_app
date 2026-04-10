import { Offer } from "@/src/core/models/Offer/Offer";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useEffect, useState } from "react";

export interface IUseTrailOffer {
    isLoading: boolean;
    error: string | null;
    trailOffers: Offer[];
}

export type UseTrailOfferParams = {
    trailId?: string;
}

export function useTrailOffer(params: UseTrailOfferParams): IUseTrailOffer{
    const { trailId } = params;
    const isLoading = useOffersStore(s => s.isLoading);
    const error = useOffersStore(s => s.error);
    const fetchOfferByTrail = useOffersStore(s => s.fetchOfferByTrail);
    const trailOffers = useOffersStore(s => s.trailOffers);

    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        const fetch = async () => {
            try {
                console.log('Fetching offers for trailId started');
                if(!trailId) return;
                await fetchOfferByTrail(trailId);
                console.log('Fetched offers for trailId done');
            } catch (error) {
                setLocalError(`Failed fetching offers for trail ${trailId}`)
            }
        }

        fetch();
    }, [trailId])

    return {
        isLoading,
        error: error || localError,
        trailOffers,
    }
}