import { useTrailStore } from "@/src/core/models/Trail/stores/trailStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useEffect } from "react";

export function useTrailItem(trailId?: string | null) {
    const { profile } = useAuthHook();

    const trail = useTrailStore(s => s.data.find(t => t.id === trailId) ?? null);
    const trailLoading = useTrailStore(s => s.isLoading);
    const trailError = useTrailStore(s => s.error);

    useEffect(() => {
        if (!trailId || !profile?.id) return;
        const fetch = async () => {
            await useTrailStore.getState().load(trailId);
        };
        fetch();
    }, [profile?.id, trailId]);

    const onRefreshTrail = async (trailId: string) => {
        if (!profile?.id) return;
        await useTrailStore.getState().load(trailId);
    }

    return {
        trail,
        trailLoading,
        trailError,
        onRefreshTrail,
    };
}
