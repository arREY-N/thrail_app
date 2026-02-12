import { Mode } from "@/src/types/Enum";
import { router } from "expo-router";
import { useEffect } from "react";
import { useTrailsStore } from "../stores/trailsStore";

type TrailParams = {
    trailId: string | null,
    mode: Mode
}

export default function useTrailDomain(params: TrailParams | null = null){
    const trails = useTrailsStore(s => s.data);
    const trail = useTrailsStore(s => s.current);

    const fetchAllTrails = useTrailsStore(s => s.fetchAll);
    const load = useTrailsStore(s => s.load);

    useEffect(() => {
        fetchAllTrails();
        load(params?.trailId);
    }, [params?.trailId])

    const onViewTrail = (trailId: string) => {
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

    const onHikePress = (trailId: string) => {
        console.log('hiking ', trailId);
    }

    const onBookPress = (trailId: string) => {
        console.log('booking', trailId);
    }

    const onWriteTrail = (trailId: string) => {
        console.log('write: ', trailId)
    }

    return{
        trails,
        trail,
        onViewTrail,
        onHikePress, 
        onBookPress,
        onWriteTrail,
    }
}