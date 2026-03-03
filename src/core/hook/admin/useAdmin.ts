import { router } from "expo-router";
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

    useEffect(() => {
        onFilterOffers();
    }, [businessOffers])

    const onFilterOffers = (date: Date | null = null) => {
        console.log(date);
        if(date){
            setFilteredOffers(() => businessOffers.filter(o => o.date.getDate() === date.getDate()).sort((a, b) => a.date.getDate() - b.date.getDate()));
        } else {
            console.log('RESET')
            setFilteredOffers(businessOffers.sort((a, b) => a.date.getDate() - b.date.getDate()));
        }
    }
    const onWriteOffer = (id: string) => {
        router.push({
            pathname: '/(main)/admin/offer/write',
            params: { offerId: id }
        })
    }

    const onManageAdminsPress = () => {
        // router.push('/(main)/admin/personnel/list');
    }

    const onManageOffersPress = () => {
        router.push({
            pathname: '/(main)/admin/offer/list',
            params: { businessId: businessAccount?.id }
        });
    }

    return {
        businessAccount,
        filteredOffers,
        isLoading,
        businessAdmins: admins,
        onReloadPress: reloadBusinessAdmins,
        onFilterOffers,
        onWriteOffer,
        onManageAdminsPress,
        onManageOffersPress,
    }
}