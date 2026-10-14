import { Location, WriteLocation } from "@/src/core/models/Location/interfaces/Location.types";
import { useLocationStore } from "@/src/core/models/Location/stores/locationStore";

export function useLocation() {
    const currentLocation = useLocationStore((s) => s.currentLocation);
    const isLoading = useLocationStore((s) => s.isLoading);
    const error = useLocationStore((s) => s.error);
    const feedLiveLocation = useLocationStore((s) => s.feedLiveLocation);
    const saveHikeHistory = useLocationStore((s) => s.saveHikeHistory);
    const setCurrentLocation = useLocationStore((s) => s.setCurrentLocation);

    const onFeedLiveLocation = async (params: WriteLocation) => {
        await feedLiveLocation(params);
    };

    const onSaveHikeHistory = async (params: Omit<WriteLocation, "groupId">) => {
        await saveHikeHistory(params);
    };

    const onSetCurrentLocation = (location: Location | null) => {
        setCurrentLocation(location);
    };

    return {
        currentLocation,
        isLoading,
        error,
        feedLiveLocation: onFeedLiveLocation,
        saveHikeHistory: onSaveHikeHistory,
        setCurrentLocation: onSetCurrentLocation,
    };
}
