import { useTrailsStore } from "../stores/trailsStore";
import { TrailParams } from "./useTrailDomain";

export default function useTrailHike(params: TrailParams){
    const trailId = params.trailId;

    const hikingTrail = useTrailsStore(s => s.hikingTrail);

    const setOnHike = useTrailsStore(s => s.setOnHike);
    const setHikingTrail = useTrailsStore(s => s.setHikingTrail);

    // useEffect(() => {
    //     if(trailId) setHikingTrail(trailId);
    // },[trailId])

    return {
        hikingTrail,
        setOnHike
    }
}