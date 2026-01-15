import { useWeatherStore } from "@/src/core/stores/weatherStore";
import { useRouter } from "expo-router";

import WeatherScreen from "../../features/Home/screens/WeatherScreen";

export default function weather() {
    const router = useRouter();

    const locationWeather = useWeatherStore((state) => state.locationWeather);

    const handleBack = () => {
        router.back();
    };

    return (
        <WeatherScreen 
            locationWeather={locationWeather} 
            onBackPress={handleBack} 
        />
    );
}