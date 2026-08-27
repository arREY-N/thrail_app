import { useTrailsStore } from "@/src/core/models/Trail/stores/trailsStore";
import { Mode } from "@/src/core/types/Enum";
import { router } from "expo-router";
import { useEffect } from "react";

export type TrailParams = {
    trailId: string | null,
    mode: Mode
}

export default function useTrailDomain(params: TrailParams | null = null) {
    const trails = useTrailsStore(s => s.data);
    const trail = useTrailsStore(s => s.current);
    const hikingTrail = useTrailsStore(s => s.hikingTrail);
    const isLoading = useTrailsStore(s => s.isLoading);

    const setOnHike = useTrailsStore(s => s.setOnHike);
    const setHikingTrail = useTrailsStore(s => s.setHikingTrail);

    const load = useTrailsStore(s => s.load);

    useEffect(() => {
        if (params?.trailId) {
            load(params.trailId);
        }
    }, [params?.trailId]);

    const activeTrail = trail as any;

    const onHikePress = (trailId: string) => {
        setHikingTrail(trailId);

        router.push({
            pathname: '/(main)/hike/view',
            params: {
                trailId,
                lon: activeTrail?.geography?.startLong,
                lat: activeTrail?.geography?.startLat,
            },
        })
    }



    return {
        trails,
        trail: activeTrail,
        hikingTrail,
        isLoading,
        setOnHike,
        onHikePress,
    }
}