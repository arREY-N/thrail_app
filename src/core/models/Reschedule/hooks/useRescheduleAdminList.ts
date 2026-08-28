import { useRescheduleStore } from "@/src/core/models/Reschedule/stores/rescheduleStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export const useRescheduleAdminList = () => {
    const { profile, role, businessId } = useAuthHook();

    const businessReschedules = useRescheduleStore(s => s.businessReschedules);
    const isFetching = useRescheduleStore(s => s.isFetching);
    const error = useRescheduleStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (role !== 'admin' || !profile?.id || !businessId) {
                return;
            }

            await useRescheduleStore.getState().fetchAllByBusinessId(businessId);
        };

        fetch();
    }, [profile?.id, businessId, role]);

    return {
        businessReschedules,
        isFetching,
        error,
    };
};