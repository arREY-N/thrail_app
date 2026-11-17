import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";
import { useEffect } from "react";

export function useBusinessList() {
    const businesses = useBusinessesStore(s => s.data);
    const isLoading = useBusinessesStore(s => s.isLoading);
    const error = useBusinessesStore(s => s.error);

    useEffect(() => {
        useBusinessesStore.getState().subscribeToBusinesses();
    }, []);

    return {
        businesses,
        isLoading,
        error,
        refresh: () => useBusinessesStore.getState().refresh(),
    };
}
