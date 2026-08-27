import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useCallback, useEffect, useMemo } from "react";


export function useBusinessAdmin() {
    const { profile, businessId, role } = useAuthHook();

    const businessAccount = useBusinessesStore(s => s.current);

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
        profile,
        role,
        businessId
    }), [onRefresh, businessAccount, profile, role, businessId])
}