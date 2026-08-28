import { useHikesStore } from "@/src/core/models/Hike/stores/hikeStore.web";

export function useHikeState() {
    const isLoading = useHikesStore(s => s.isLoading);
    const error = useHikesStore(s => s.error);

    return {
        isLoading,
        error,
    }
}