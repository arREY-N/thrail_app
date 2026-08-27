import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useOfferStore } from "@/src/core/models/Offer/stores/offerStore";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";

export function useOfferAdminList() {
    const { profile, businessId, role } = useAuthHook();

    const businessOffers = useOfferStore(s => s.businessOffers);
    const isLoading = useOfferStore(s => s.isLoading);
    const error = useOfferStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (!profile?.id || !businessId) return;

            await Promise.all([
                useOfferStore.getState().fetchOfferByBusiness(businessId),
            ])
        }

        fetch();
    }, [profile?.id, businessId])

    const onRefresh = useCallback(async () => {
        if (!profile?.id || !businessId) return;

        await Promise.all([
            useOfferStore.getState().fetchOfferByBusiness(businessId),
        ])
    }, [profile?.id, businessId])

    const onViewOfferBookings = (offerId: string) => {
        router.push({
            pathname: '/(main)/admin/offer/view',
            params: { offerId }
        });
    }

    return useMemo(() => ({
        onRefresh,
        onViewOfferBookings,
        businessOffers,
        profile,
        role,
        error,
        businessId,
        isLoading,
    }), [onRefresh, error, businessOffers, profile, role, businessId, isLoading])
}