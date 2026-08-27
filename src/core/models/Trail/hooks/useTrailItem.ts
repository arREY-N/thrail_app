import { useTrailStore } from "@/src/core/models/Trail/stores/trailStore";
import { useEffect } from "react";

export function useTrailItem(trailId?: string | null) {
    const trail = useTrailStore(s => (trailId ? s.data.find(t => t.id === trailId) : s.current) || null);
    const isLoading = useTrailStore(s => s.isLoading);
    const error = useTrailStore(s => s.error);

    useEffect(() => {
        if (!trailId) return;
        const fetch = async () => {
            await useTrailStore.getState().load(trailId);
        };
        fetch();
    }, [trailId]);

    return {
        trail,
        isLoading,
        error,
    };
}
