import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function hike(){
    const { id } = useLocalSearchParams();

    const trails = useTrailsStore(s => s.trails);
    const hikeTrail = trails.find(t => t.id === id);
    const [hiking, setHiking] = useState(false);

    const onStartHikePress = () => {
        setHiking(!hiking);
    }

    return(
        <TESTHIKE
            hikeTrail={hikeTrail}
            hiking={hiking}
            onStartHikePress={onStartHikePress}
        />
    )
}

const TESTHIKE = ({
    hikeTrail,
    hiking,
    onStartHikePress
}) => {
    
    return(
        <View>
            <Text> { hikeTrail.name } </Text>
            <Text> { hiking ? 'HIKING' : 'STOPPED'} </Text>
            <Pressable onPress={onStartHikePress}>
                <Text>{ hiking ? 'STOP' : 'START' }</Text>
            </Pressable>
        </View>
    )
}