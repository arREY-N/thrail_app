import { useAdminStore } from "@/src/core/models/Admin/stores/adminStore";
import { useCallback, useEffect } from "react";

export function useAdminList(businessId?: string | null) {
    const admins = useAdminStore(s => s.businessAdmins);
    const isLoading = useAdminStore(s => s.isLoading);
    const error = useAdminStore(s => s.error);

    useEffect(() => {
        const fetchAll = async () => {
            if (businessId) {
                await useAdminStore.getState().fetchAllByBusinessId(businessId);
            }
        };

        fetchAll();
    }, [businessId]);

    const onRefresh = useCallback(async () => {
        if (businessId) {
            await useAdminStore.getState().fetchAllByBusinessId(businessId);
        }
    }, [businessId]);

    return {
        admins,
        isLoading,
        error,
        onRefresh,
    };
}
