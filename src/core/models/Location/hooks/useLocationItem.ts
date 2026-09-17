import { Location } from "@/src/core/models/Location/interfaces/Location.types";
import { useLocationStore } from "@/src/core/models/Location/stores/locationStore";

export function useLocationItem(userId?: string, groupId?: string) {
    const currentLocation = useLocationStore((s) => s.currentLocation);
    const groupLocations = useLocationStore((s) => s.groupLocations);
    const isLoading = useLocationStore((s) => s.isLoading);
    const error = useLocationStore((s) => s.error);

    let location: Location | null = null;

    if (groupId && userId) {
        const groupList = groupLocations[groupId] ?? [];
        location = groupList.find((loc) => loc.id === userId) ?? null;
    } else {
        location = currentLocation;
    }

    return {
        location,
        isLoading,
        error,
    };
}
