import TESTHIKE from "@/src/components/TESTCOMPONENTS/TestHike";
import useTrailHike from "@/src/core/hook/useTrailHike";
import { Stack } from "expo-router";

export default function hikeView(){
    // const { trailId } = useLocalSearchParams();
    
    const { 
        hikingTrail, 
        setOnHike, 
    } = useTrailHike({});

    return(
        <>
            <Stack.Screen options={{headerShown: true}}/> 
            <TESTHIKE
                hikeTrail={hikingTrail}
                onStartHikePress={setOnHike}
            />
        </>
    )
}