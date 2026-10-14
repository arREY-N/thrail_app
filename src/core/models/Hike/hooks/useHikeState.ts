import { useHikesStore } from "@/src/core/models/Hike/stores/hikeStore.web";

export function useHikeState() {
    const hikeLoading = useHikesStore(s => s.isLoading);
    const hikeError = useHikesStore(s => s.error);

    return {
        hikeLoading,
        hikeError,
    }
}