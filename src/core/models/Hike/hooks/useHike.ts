import { useTrailsStore } from "@/src/core/models/Trail/Trail";
import { router } from "expo-router";
import { useEffect } from "react";

export function useHike(trailId: string) {
    const trail = useTrailsStore(s => s.current);
    const hikingTrail = useTrailsStore(s => s.hikingTrail);
    const setOnHike = useTrailsStore(s => s.setOnHike);

    const setHikingTrail = useTrailsStore(s => s.setHikingTrail);

    const load = useTrailsStore(s => s.load);

    useEffect(() => {
        if (trailId) {
            load(trailId);
        }
    }, [trailId, load]);

    const onHikePress = (trailId: string) => {
        setHikingTrail(trailId);

        router.push({
            pathname: '/(main)/hike/view',
            params: {
                trailId,
                lon: trail?.geography?.startLong,
                lat: trail?.geography?.startLat,
            },
        })
    }

    return {
        trail,
        hikingTrail,
        setOnHike,
        onHikePress,
    }
}   