import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { useEffect, useState } from "react";

export interface IUseTrailOffer {
    isLoading: boolean;
    error: string | null;
    trailOffers: Offer[];
}

export type UseTrailOfferParams = {
    trailId?: string;
}

export function useTrailOffer(params: UseTrailOfferParams): IUseTrailOffer {
    const { trailId } = params;
    const isLoading = useOfferStore(s => s.isLoading);
    const error = useOfferStore(s => s.error);
    const fetchOfferByTrail = useOfferStore(s => s.fetchOfferByTrail);
    const trailOffers = useOfferStore(s => s.trailOffers);

    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => {
        const fetch = async () => {
            try {
                console.log('Fetching offers for trailId started');
                if (!trailId) return;
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