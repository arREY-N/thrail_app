import { useBookingsStore } from "@/src/core/models/Booking/Booking";
import { useBusinessState } from "@/src/core/models/Business/hooks/useBusinessState";
import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useOfferStore } from "@/src/core/models/Offer/Offer";
import { useAuthHook } from "@/src/core/models/User/User";
import { useCallback, useEffect, useMemo } from "react";

/**
 * General hook to access all business-related store data, including admins, offers, and bookings.
 * Use this hook in every business-related screen.
 * @returns 
 */
export function useBusinessAdmin() {
    const { profile, businessId, role, isLoading: isAuthLoading } = useAuthHook();
    const { isLoading, isFetching, error } = useBusinessState();

    const businessAccount = useBusinessesStore(s => s.current);
    const businessAdmins = useBusinessesStore(s => s.businessAdmins);
    const businessOffers = useOfferStore(s => s.businessOffers);
    const businessBookings = useBookingsStore(s => s.businessBookings);

    useEffect(() => {
        const fetch = async () => {
            if (!profile?.id || !businessId) return;

            const current = useBusinessesStore.getState().current;
            if (current?.id === businessId) return;

            await useBusinessesStore.getState().load(businessId);
        };

        fetch();
    }, [profile?.id, businessId]);

    const onRefresh = useCallback(async () => {
        if (!profile?.id || !businessId) return;

        await useBusinessesStore.getState().load(businessId);
    }, [profile?.id, businessId]);

    const updatePaymentConfig = useBusinessesStore(s => s.updatePaymentConfig);

    const isBusinessLoading = isAuthLoading || isLoading || isFetching || (!businessAccount && Boolean(businessId) && !error);

    return useMemo(() => ({
        onRefresh,
        updatePaymentConfig,
        businessAccount,
        businessAdmins,
        businessOffers,
        businessBookings,
        profile,
        role,
        businessId,
        isLoading: isBusinessLoading,
        isFetching,
        isAuthLoading,
        error,
    }), [onRefresh, updatePaymentConfig, businessAccount, businessAdmins, businessOffers, businessBookings, profile, role, businessId, isBusinessLoading, isFetching, isAuthLoading, error]);
}