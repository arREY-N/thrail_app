import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useRescheduleStore } from "@/src/core/models/Reschedule/stores/rescheduleStore";
import { useEffect } from "react";

export const useRescheduleUserList = () => {
    const { profile } = useAuthHook();
    const userReschedules = useRescheduleStore(s => s.userReschedules);
    const isFetching = useRescheduleStore(s => s.isFetching);
    const error = useRescheduleStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (!profile?.id) {
                return;
            }

            await useRescheduleStore.getState().fetchAllUserReschedules(profile.id);
        };

        fetch();
    }, [profile?.id]);

    return {
        userReschedules,
        isFetching,
        error,
    };
};