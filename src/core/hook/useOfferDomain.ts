import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Offer } from "../models/Offer/Offer";
import { useOffersStore } from "../stores/offersStore";

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
    
    const [filteredOffers, setFilteredOffers] = useState<Offer[] |[]>([]);
    const [date, setDate] = useState<Date>();
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
    
    function filterOffers(){
        if(date){
            setFilteredOffers(() => list.filter(o => o.date === date).sort((a, b) => a.date.getDate() - b.date.getDate()))
        } else {
            setFilteredOffers(list);
        }
    }

    function onBookNowPress(offerId: string){ 
        router.push({ 
            pathname: '/(main)/offer/view',
            params: { offerId }
        })
    }

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
        date,
        isLoading,
        filteredOffers,
        filterOffers,
        setDate,
        onBookNowPress,
        onSeeTrailOffers,
    }
}