import { useAdminStore } from "@/src/core/models/Admin/stores/adminStore";
import { useEffect } from "react";

export function useAdminItem(businessId?: string | null, adminId?: string | null) {
    const admin = useAdminStore(s => s.current);
    const isLoading = useAdminStore(s => s.isLoading);
    const error = useAdminStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (businessId && adminId) {
                await useAdminStore.getState().fetchById(businessId, adminId);
            }
        };

        fetch();
    }, [businessId, adminId]);

    return {
        admin,
        isLoading,
        error,
    };
}
