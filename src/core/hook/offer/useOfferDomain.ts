import { Offer } from "@/src/core/models/Offer/Offer";
import { useOffersStore } from "@/src/core/stores/offersStore";
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

    const fetchOffer = useOffersStore(s => s.load);
    const fetchTrailOffers = useOffersStore(s => s.fetchOfferByTrail)
    const fetchOffers = useOffersStore(s => s.fetchAll);
    
    const offers = useOffersStore(s => s.data);
    const offer = useOffersStore(s => s.current);
    const trailOffers = useOffersStore(s => s.trailOffers);
    const businessOffers = useOffersStore(s => s.businessOffers);
    const error = useOffersStore(s => s.error);
    const isLoading = useOffersStore(s => s.isLoading);
    
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