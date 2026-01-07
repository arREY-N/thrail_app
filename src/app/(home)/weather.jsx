import { useWeatherStore } from "@/src/core/stores/weatherStore";
import { Text, View } from "react-native";

export default function weather() {
    const locationWeather = useWeatherStore((state) => state.locationWeather);

    return(
        <View>
            <Text>Weather page</Text>
            <View>
                <Text>Location: {locationWeather.location}</Text>
                <Text>Temperature: {locationWeather.temperature}°C</Text>
                <Text>Day: {locationWeather.day}°C</Text>
                <Text>Night: {locationWeather.night}°C</Text>
            </View>
        </View>
    )
}