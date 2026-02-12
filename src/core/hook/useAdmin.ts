import { OfferUI, UseOfferParams } from "@/src/types/entities/Offer";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useBusinessesStore } from "../stores/businessesStore";
import { useOffersStore } from "../stores/offersStore";

export function useAdmin(params: UseOfferParams){
    const { businessId } = params

    const businessAccount = useBusinessesStore(s => s.current);
    const loadBusinessAccount = useBusinessesStore(s => s.load);
    const loadBusinessAdmins = useBusinessesStore(s => s.loadBusinessAdmins);
    const reloadBusinessAdmins = useBusinessesStore(s => s.reloadBusinessAdmins);
    const admins = useBusinessesStore(s => s.businessAdmins);

    const fetchAllBusinessOffers = useOffersStore(s => s.fetchOfferByBusiness);
    const businessOffers = useOffersStore(s => s.businessOffers);
    const isLoading = useOffersStore(s => s.isLoading);

    const [filteredOffers, setFilteredOffers] = useState<OfferUI[]>(businessOffers);

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
            setFilteredOffers(() => businessOffers.filter(o => o.hikeDate.getDate() === date.getDate()).sort((a, b) => a.hikeDate.getDate() - b.hikeDate.getDate()));
        } else {
            console.log('RESET')
            setFilteredOffers(businessOffers.sort((a, b) => a.hikeDate.getDate() - b.hikeDate.getDate()));
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