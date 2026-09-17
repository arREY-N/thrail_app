import { useGroupStore } from "@/src/core/models/Group/stores/groupStore";
import { useEffect } from "react";

export function useGroupItem(id?: string | null) {
    const group = useGroupStore(s => (id ? s.groups.find(g => g.id === id) || null : null));
    const isLoading = useGroupStore(s => s.isLoading);
    const isFetching = useGroupStore(s => s.isFetching);
    const error = useGroupStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (id !== undefined && id !== null && id !== '') {
                await useGroupStore.getState().fetchGroupById(id);
            }
        };

        fetch();
    }, [id]);

    return {
        group,
        isLoading,
        isFetching,
        error,
    };
}
