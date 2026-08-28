import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useCallback, useEffect, useMemo } from "react";

export function useBusinessAdminList() {
    const { businessId, role } = useAuthHook();

    const businessAdmins = useBusinessesStore(s => s.businessAdmins)

    useEffect(() => {
        const fetch = async () => {
            if (!businessId || !role || role !== 'admin') return;
            await useBusinessesStore.getState().loadBusinessAdmins(businessId)
        }

        fetch();
    }, [businessId, role]);

    const onRefreshBusinessAdmins = useCallback(async () => {
        if (!businessId || !role || role !== 'admin') return;
        await useBusinessesStore.getState().reloadBusinessAdmins(businessId)
    }, [businessId, role])

    return useMemo(() => ({
        onRefreshBusinessAdmins,
        businessAdmins
    }), [
        onRefreshBusinessAdmins,
        businessAdmins
    ])
}