import { useLocalSearchParams, useRouter } from "expo-router";
import WeatherScreen from "@/src/features/Home/screens/WeatherScreen";

export default function Weather() {
    const router = useRouter();
    const params = useLocalSearchParams<{ lat?: string; lon?: string; name?: string }>();

    const handleBack = () => {
        router.back();
    };

    const parsedLat = params.lat ? parseFloat(params.lat) : undefined;
    const parsedLon = params.lon ? parseFloat(params.lon) : undefined;

    return (
        <WeatherScreen
            latitude={parsedLat}
            longitude={parsedLon}
            locationName={params.name}
            onBackPress={handleBack}
        />
    );
}