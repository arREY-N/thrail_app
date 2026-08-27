import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useEffect } from "react";

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

    return {
        businessAdmins
    }
}