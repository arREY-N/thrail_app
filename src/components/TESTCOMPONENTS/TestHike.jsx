import { Pressable, Text, View } from "react-native";

const TESTHIKE = ({
    hikeTrail,
    onStartHikePress,
}) => {
    return(
        <View>
            { hikeTrail && 
                <View>
                    <Text> { hikeTrail.trail.name } </Text>
                    <Text> { hikeTrail.hiking ? 'HIKING' : 'STOPPED'} </Text>
                    <Pressable onPress={onStartHikePress}>
                        <Text>{ hikeTrail.hiking ? 'STOP' : 'START' }</Text>
                    </Pressable>
                    <View>
                        { hikeTrail.map && <Text>{ hikeTrail.map.map } </Text>}
                    </View>
                    <View>
                        { hikeTrail.weather && <Text>{ hikeTrail.weather.weather } </Text>}
                    </View>
                </View>
            }
        </View>
    )
}

export default TESTHIKE;