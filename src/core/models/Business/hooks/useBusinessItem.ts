import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useEffect } from "react";

export function useBusinessItem(id?: string | null) {
    const business = useBusinessesStore(s => s.current);
    const isLoading = useBusinessesStore(s => s.isLoading);
    const error = useBusinessesStore(s => s.error);

    useEffect(() => {
        const fetch = async () => {
            if (id !== undefined && id !== null) {
                await useBusinessesStore.getState().load(id);
            }
        };

        fetch();
    }, [id]);

    return {
        business,
        isLoading,
        error,
    };
}
