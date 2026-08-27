import { useTrailsStore } from "@/src/core/models/Trail/stores/trailsStore";
import { Mode } from "@/src/core/types/Enum";
import { router } from "expo-router";

export type TrailParams = {
    trailId: string | null,
    mode: Mode
}

export default function useTrailView() {
    const trails = useTrailsStore(s => s.data);
    const trail = useTrailsStore(s => s.current);
    const hikingTrail = useTrailsStore(s => s.hikingTrail);
    const isLoading = useTrailsStore(s => s.isLoading);

    const setOnHike = useTrailsStore(s => s.setOnHike);
    const setHikingTrail = useTrailsStore(s => s.setHikingTrail);

    const activeTrail = trail as any;

    const onViewTrail = (trailId: string) => {
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

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

    const onWriteTrail = (trailId: string) => {
        console.log('write: ', trailId)
        if (trailId) {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
                params: { trailId }
            });
        } else {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
            });
        }
    }

    return {
        trails,
        trail: activeTrail,
        hikingTrail,
        isLoading,
        setOnHike,
        onViewTrail,
        onHikePress,
        onWriteTrail
    }
}