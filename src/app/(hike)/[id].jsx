import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

export default function hike(){
    const { id } = useLocalSearchParams();
    const setHikingTrail = useTrailsStore(s => s.hikeTrail);
    const onStartHikePress = useTrailsStore(s => s.setOnHike);
    const isLoading = useTrailsStore(s => s.isLoading)
    useEffect(() => {
        setHikingTrail(id);
    }, [id]);

    const hikeTrail = useTrailsStore(s => s.hikingTrail.trail);
    const map = useTrailsStore(s => s.hikingTrail.map);
    const hiking = useTrailsStore(s => s.hikingTrail.hiking); 
    const weather = useTrailsStore(s => s.hikingTrail.weather);

    if(isLoading || !hikeTrail) return <Text>LOADING</Text>

    if(!isLoading && !hikeTrail) return <Text>NO TRAIL DATA FOUND</Text>

    return(
        <TESTHIKE
            hikeTrail={hikeTrail}
            hiking={hiking}
            onStartHikePress={onStartHikePress}
            map={map}
            weather={weather}
        />
    )
}

const TESTHIKE = ({
    hikeTrail,
    hiking,
    onStartHikePress,
    map,
    weather
}) => {
    return(
        <View>
            <Text> { hikeTrail.name } </Text>
            <Text> { hiking ? 'HIKING' : 'STOPPED'} </Text>
            <Pressable onPress={onStartHikePress}>
                <Text>{ hiking ? 'STOP' : 'START' }</Text>
            </Pressable>
            <View>
                { map && <Text>{ map.map } </Text>}
            </View>
            <View>
                { weather && <Text>{ weather.weather } </Text>}
            </View>
        </View>
    )
}