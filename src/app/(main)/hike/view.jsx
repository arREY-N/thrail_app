import TESTHIKE from "@/src/components/TESTCOMPONENTS/TestHike";
import useTrailHook from "@/src/core/hook/useTrailHook";
import { useLocalSearchParams } from "expo-router";

export default function hikeView(){
    const { trailId } = useLocalSearchParams();
    
    const { 
        hikingTrail, 
        setOnHike, 
    } = useTrailHook({ trailId, mode: 'view' });


    return(
        <TESTHIKE
            hikeTrail={hikingTrail}
            onStartHikePress={setOnHike}
        />
    )
}