import { useWeather } from "@/src/core/context/WeatherProvider";
import { Text, View } from "react-native";

export default function weather() {
    const { locationTemp } = useWeather();

    return(
        <View>
            <Text>Weather page</Text>
            {
                <View>
                    <Text>Location: {locationTemp.location}</Text>
                    <Text>Temperature: {locationTemp.temperature}°C</Text>
                    <Text>Day: {locationTemp.day}°C</Text>
                    <Text>Night: {locationTemp.night}°C</Text>
                </View>
            }
        </View>
    )
}