import { useUserStore } from "@/src/core/models/User/stores/userStore";
import { useEffect } from "react";

export function useUserItem(userId?: string | null) {
    const user = useUserStore(s => s.current);
    const isLoading = useUserStore(s => s.isLoading);
    const error = useUserStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (userId) {
                await useUserStore.getState().load(userId);
            }
        };

        fetch();
    }, [userId]);

    return {
        user,
        isLoading,
        error,
    };
}
