import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";

export default function useAdminOffer() {
    const { businessId } = useAuthHook();

    const loadBusinessOffers = useOffersStore(s => s.fetchOfferByBusiness);
    const businessOffers = useOffersStore(s => s.businessOffers); 

    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if(!businessId){
            setLocalError('No business ID found');
            return;
        }
        console.log('Loading offers for business: ', businessId);
        loadBusinessOffers(businessId);
    }, [businessId])

    const onViewOfferBookings = (offerId: string) => {
        router.push({
            pathname: '/(main)/admin/offer/view',
            params: { offerId }
        });
    }

    console.log(businessOffers)
    return {
        isLoading: useOffersStore(s => s.isLoading),
        error: useOffersStore(s => s.error) || localError,
        businessOffers, 
        onViewOfferBookings
    }
}