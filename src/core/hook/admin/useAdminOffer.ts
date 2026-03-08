import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Offer } from "@/src/core/models/Offer/Offer";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useEffect, useState } from "react";

export interface IUseAdminOffer {
    isLoading: boolean;
    error: string | null;
    businessOffers: Offer[];
}

export type UseAdminOfferParams = {

}

export default function useAdminOffer(params: UseAdminOfferParams): IUseAdminOffer {
    const { businessId } = useAuthHook();

    const loadBusinessOffers = useOffersStore(s => s.fetchOfferByBusiness);

    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if(!businessId){
            setLocalError('No business ID found');
            return;
        }
        loadBusinessOffers(businessId);
    }, [businessId])

    return {
        isLoading: useOffersStore(s => s.isLoading),
        error: useOffersStore(s => s.error) || localError,
        businessOffers: useOffersStore(s => s.businessOffers), 
    }
}