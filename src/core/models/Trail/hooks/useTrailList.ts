import { useTrailStore } from "@/src/core/models/Trail/stores/trailStore";
import { useAuthHook } from "@/src/core/models/User/User";
import { useCallback, useEffect } from "react";

export function useTrailList() {
    const { profile } = useAuthHook();

    const trails = useTrailStore(s => s.data);
    const trailError = useTrailStore(s => s.error);
    const trailLoading = useTrailStore(s => s.isLoading);

    useEffect(() => {
        if (!profile?.id) return;

        const fetch = async () => {
            await useTrailStore.getState().fetchAll();
        };

        fetch();
    }, [profile?.id]);

    const onRefreshTrails = useCallback(async () => {
        if (!profile?.id) return;
        await useTrailStore.getState().fetchAll();
    }, [profile?.id]);

    return {
        trails,
        trailError,
        trailLoading,
        onRefreshTrails
    };
}