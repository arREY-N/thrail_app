import { useBusinessesStore } from "@/src/core/models/Business/Business";
import { Offer, useOfferStore } from "@/src/core/models/Offer/Offer";
import { useEffect, useState } from "react";


export type AdminParams = {
    businessId: string | null
}

export function useAdmin(params: AdminParams) {
    const { businessId } = params

    const businessAccount = useBusinessesStore(s => s.current);
    const loadBusinessAccount = useBusinessesStore(s => s.load);
    const loadBusinessAdmins = useBusinessesStore(s => s.loadBusinessAdmins);
    const reloadBusinessAdmins = useBusinessesStore(s => s.reloadBusinessAdmins);
    const admins = useBusinessesStore(s => s.businessAdmins);

    const fetchAllBusinessOffers = useOfferStore(s => s.fetchOfferByBusiness);
    const businessOffers = useOfferStore(s => s.businessOffers);
    const isLoading = useOfferStore(s => s.isLoading);

    const [filteredOffers, setFilteredOffers] = useState<Offer[]>(businessOffers);

    useEffect(() => {
        if (businessId) {
            loadBusinessAccount(businessId);
            loadBusinessAdmins(businessId)
            fetchAllBusinessOffers(businessId);
        }
    }, [businessId, fetchAllBusinessOffers, loadBusinessAccount, loadBusinessAdmins]);

    return {
        businessAccount,
        filteredOffers,
        isLoading,
        businessAdmins: admins,
        onReloadPress: reloadBusinessAdmins
    }
}