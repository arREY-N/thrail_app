import { Offer } from "@/src/core/models/Offer/Offer";
import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore.web";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export type UseOfferParams = {
    trailId: string | null,
    businessId: string | null,
    offerId: string | null,
    mode: string | null,
}

export function useOfferDomain(params: UseOfferParams){
    const { offerId, trailId, mode } = params;

    const fetchOffer = useOfferStore(s => s.fetchOfferById);
    const fetchTrailOffers = useOfferStore(s => s.fetchOfferByTrail);
    const fetchOffers = useOfferStore(s => s.fetchAll);
    
    const offers = useOfferStore(s => s.data);
    const offer = useOfferStore(s => s.current);
    const trailOffers = useOfferStore(s => s.trailOffers);
    const businessOffers = useOfferStore(s => s.businessOffers);
    const error = useOfferStore(s => s.error);
    const isLoading = useOfferStore(s => s.isLoading);
    
    const [list, setList] = useState<Offer[]>([]);
    
    useEffect(() => {
        fetchOffers();
    },[])

    useEffect(() => {    
        if(offerId) {
            console.log('fetching offer: ', offerId)
            fetchOffer(offerId);
            setList(offers);
        }
        if(trailId) {
            console.log('fetching for trail: ', trailId)
            fetchTrailOffers(trailId);
        }
    }, [offerId, trailId])
    
    useEffect(() => {
        if(mode === 'trail') {
            setList(trailOffers);
        } else if (mode === 'business') {
            setList(businessOffers)
        } else {
            setList(offers);
        }
    }, [offers, trailOffers, businessOffers]);

    function onSeeTrailOffers(trailId: string){
        router.push({
            pathname: '/(main)/offer/list',
            params: { trailId, mode: 'trail' }
        })  
    } 

    return {
        offer,
        offers,
        error,
        list,
        isLoading,
        onSeeTrailOffers,
    }
}