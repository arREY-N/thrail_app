import TESTHIKE from "@/src/components/TESTCOMPONENTS/TestHike";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";

export default function hike(){
    const { trailId } = useLocalSearchParams();
    const setHikingTrail = useTrailsStore(s => s.hikeTrail);
    const onStartHikePress = useTrailsStore(s => s.setOnHike);
    const isLoading = useTrailsStore(s => s.isLoading)
    
    useEffect(() => {
        setHikingTrail(trailId);
    }, [trailId]);

    const hikeTrail = useTrailsStore(s => s.hikingTrail);

    if(isLoading || !hikeTrail) return <Text>LOADING</Text>

    if(!isLoading && !hikeTrail) return <Text>NO TRAIL DATA FOUND</Text>

    return(
        <TESTHIKE
            hikeTrail={hikeTrail}
            onStartHikePress={onStartHikePress}
        />
    )
}