import { Mode } from "@/src/core/types/Enum";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTrailsStore } from "../../stores/trailsStore";

export type TrailParams = {
    trailId: string | null,
    mode: Mode
}

export default function useTrailDomain(params: TrailParams | null = null){
    const trails = useTrailsStore(s => s.data);
    const trail = useTrailsStore(s => s.current);
    const hikingTrail = useTrailsStore(s => s.hikingTrail);

    const setOnHike = useTrailsStore(s => s.setOnHike);
    const setHikingTrail = useTrailsStore(s => s.setHikingTrail);
    const fetchAllTrails = useTrailsStore(s => s.fetchAll);
    const load = useTrailsStore(s => s.load);

    useEffect(() => {
        fetchAllTrails();
        load(params?.trailId ?? null);
    }, [params?.trailId])

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
        if(trailId){
            router.push({
                pathname: '/(main)/superadmin/trail/write',
                params: {trailId}
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
        setOnHike,
        onViewTrail,
        onHikePress,
        onWriteTrail,
    }
}