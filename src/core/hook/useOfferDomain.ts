import { OfferUI, UseOfferParams } from "@/src/types/entities/Offer";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useOffersStore } from "../stores/offersStore";


export function useOfferDomain(params: UseOfferParams){
    const { offerId, trailId } = params;
    const fetchOffer = useOffersStore(s => s.load);
    const fetchTrailOffers = useOffersStore(s => s.fetchOfferByTrail)

    const offers = useOffersStore(s => s.data);
    const offer = useOffersStore(s => s.current);
    const trailOffers = useOffersStore(s => s.trailOffers);
    const error = useOffersStore(s => s.error);
    
    useEffect(() => {
        if(offerId) fetchOffer(offerId);
        if(trailId) fetchTrailOffers(trailId);
    }, [offerId, trailId])

    const [filteredOffers, setFilteredOffers] = useState<OfferUI[] |[]>([]);
    const [date, setDate] = useState<Date>();

    useEffect(() => {
        setFilteredOffers(offers.length > 0 ? offers : []);
    }, [offers]);

    const filterOffers = () => {
        if(date){
            setFilteredOffers(() => offers.filter(o => o.hikeDate === date).sort((a, b) => a.hikeDate.getDate() - b.hikeDate.getDate()))
        } else {
            setFilteredOffers(offers);
        }
    }

    const onBookNowPress = (offerId: string) => { 
        router.push({ 
            pathname: '/(main)/offer/view',
            params: { offerId }
        })
    }

    return {
        offer,
        trailOffers,
        error,
        filteredOffers,
        offers,
        date,
        filterOffers,
        setDate,
        onBookNowPress,
    }
}