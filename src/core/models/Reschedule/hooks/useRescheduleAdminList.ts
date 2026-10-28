import { useRescheduleStore } from "@/src/core/models/Reschedule/stores/rescheduleStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export const useRescheduleAdminList = () => {
    const { profile, role, businessId } = useAuthHook();

    const businessReschedules = useRescheduleStore(s => s.businessReschedules);
    const isFetching = useRescheduleStore(s => s.isFetching);
    const error = useRescheduleStore(s => s.error);

    useEffect(() => {
        if ((role !== 'admin' && role !== 'superadmin') || !profile?.id || !businessId) {
            return;
        }

        const unsubscribe = useRescheduleStore.getState().subscribeToBusinessReschedules(businessId);
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [profile?.id, businessId, role]);

    return {
        businessReschedules,
        isFetching,
        error,
    };
};