import { useBusinessesStore } from "@/src/core/models/Business/stores/businessStore";

export function useBusinessState() {
    const isLoading = useBusinessesStore(s => s.isLoading);
    const error = useBusinessesStore(s => s.error);

    return {
        isLoading,
        error,
    }
}