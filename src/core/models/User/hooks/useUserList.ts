import { useUserStore } from "@/src/core/models/User/stores/userStore";
import { useEffect } from "react";

export function useUserList() {
    const users = useUserStore(s => s.data);
    const isLoading = useUserStore(s => s.isLoading);
    const error = useUserStore(s => s.error);

    useEffect(() => {
        const fetchAll = async () => {
            await useUserStore.getState().fetchAll();
        };

        fetchAll();
    }, []);

    return {
        users,
        isLoading,
        error,
        reload: async () => {
            await useUserStore.getState().refresh();
        },
    };
}
