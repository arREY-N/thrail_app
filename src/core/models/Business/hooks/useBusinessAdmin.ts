import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBookingAdminList } from "@/src/core/models/Booking/Booking";
import { useBusinessAdminList } from "@/src/core/models/Business/hooks/useBusinessAdminList";
import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useOfferAdminList } from "@/src/core/models/Offer/Offer";
import { useCallback, useEffect, useMemo } from "react";

/**
 * General hook to access all business-related store data, including admins, offers, and bookings.
 * Use this hook in every business-related screen.
 * @returns 
 */
export function useBusinessAdmin() {
    const { profile, businessId, role } = useAuthHook();
    const businessAccount = useBusinessesStore(s => s.current);

    const { businessAdmins } = useBusinessAdminList();
    const { businessOffers } = useOfferAdminList();
    const { businessBookings } = useBookingAdminList();

    useEffect(() => {
        const fetch = async () => {
            if (!profile?.id || !businessId) return;

            await useBusinessesStore.getState().load(businessId)
        }

        fetch();
    }, [profile?.id, businessId])

    const onRefresh = useCallback(async () => {
        if (!profile?.id || !businessId) return;

        await useBusinessesStore.getState().load(businessId)
    }, [profile?.id, businessId])

    return useMemo(() => ({
        onRefresh,
        businessAccount,
        businessAdmins,
        businessOffers,
        businessBookings,
        profile,
        role,
        businessId
    }), [onRefresh, businessAccount, businessAdmins, businessOffers, businessBookings, profile, role, businessId])
}