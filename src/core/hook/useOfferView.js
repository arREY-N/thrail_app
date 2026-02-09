import { useBookingsStore } from '@/src/core/stores/bookingsStore';
import { useOffersStore } from '@/src/core/stores/offersStore';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
export function useOfferView({
    trailId,
}){
    const bookingError = useBookingsStore(s => s.error);
    const offerError = useOffersStore(s => s.error);
    const loadTrailOffers = useOffersStore(s => s.loadTrailOffers);
    const offers = useOffersStore(s =>s.offers);

    const [filteredOffers, setFilteredOffers] = useState([]);
    const [date, setDate] = useState('');
    const isLoading = useOffersStore(s => s.isLoading);

    useEffect(() => {
        if(trailId) {
            loadTrailOffers(trailId);
        };
    }, [trailId])
    
    useEffect(() => {
        if(offers.length > 0){
            setFilteredOffers(offers);
        }else {
            setFilteredOffers([]);
        }    
    }, [offers]);

    function onBookNowPress(offerId){
        router.push({ 
            pathname: '/(main)/offer/view',
            params: { offerId }
        })
    }

    return {
        bookingError,
        offerError,
        filteredOffers,
        offers,
        date,
        isLoading,
        setDate,
        onBookNowPress,
    }
}