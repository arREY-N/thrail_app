import { useEffect, useState } from "react";
import { Offer } from "../../models/Offer/Offer";
import { useBusinessesStore } from "../../stores/businessesStore";
import { useOffersStore } from "../../stores/offersStore";

export type AdminParams = {
    businessId: string | null
}

export function useAdmin(params: AdminParams){
    const { businessId } = params

    const businessAccount = useBusinessesStore(s => s.current);
    const loadBusinessAccount = useBusinessesStore(s => s.load);
    const loadBusinessAdmins = useBusinessesStore(s => s.loadBusinessAdmins);
    const reloadBusinessAdmins = useBusinessesStore(s => s.reloadBusinessAdmins);
    const admins = useBusinessesStore(s => s.businessAdmins);

    const fetchAllBusinessOffers = useOffersStore(s => s.fetchOfferByBusiness);
    const businessOffers = useOffersStore(s => s.businessOffers);
    const isLoading = useOffersStore(s => s.isLoading);

    const [filteredOffers, setFilteredOffers] = useState<Offer[]>(businessOffers);

    useEffect(() => {
        if(businessId) {
            loadBusinessAccount(businessId);
            loadBusinessAdmins(businessId)
            fetchAllBusinessOffers(businessId);
        }
    }, [businessId]);

    return {
        businessAccount,
        filteredOffers,
        isLoading,
        businessAdmins: admins,
        onReloadPress: reloadBusinessAdmins
    }
}