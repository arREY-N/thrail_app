import { useTrailStore } from "@/src/core/models/Trail/stores/trailStore";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";

export function useTrailList() {
    const trails = useTrailStore(s => s.data);
    const error = useTrailStore(s => s.error);
    const isLoading = useTrailStore(s => s.isLoading);
    const discoverTrails = useMemo(() => {
        return trails.slice(0, 3);
    }, [trails]);

    useEffect(() => {
        const fetch = async () => {
            await useTrailStore.getState().fetchAll();
        };

        fetch();
    }, []);

    const onViewTrail = (trailId: string) => {
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        });
    };

    return {
        trails,
        error,
        isLoading,
        discoverTrails,
        onViewTrail
    };
}