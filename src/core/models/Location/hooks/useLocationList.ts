import { Location } from "@/src/core/models/Location/interfaces/Location.types";
import { useLocationStore } from "@/src/core/models/Location/stores/locationStore";
import { useEffect } from "react";

export function useLocationList(groupId?: string) {
    const groupLocations = useLocationStore((s) => s.groupLocations);
    const isLoading = useLocationStore((s) => s.isLoading);
    const error = useLocationStore((s) => s.error);
    const subscribeToGroupLocations = useLocationStore((s) => s.subscribeToGroupLocations);
    const unsubscribeFromGroupLocations = useLocationStore((s) => s.unsubscribeFromGroupLocations);

    const locations: Location[] = groupId ? groupLocations[groupId] ?? [] : [];

    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = subscribeToGroupLocations(groupId);

        return () => {
            if (unsubscribe) {
                unsubscribe();
            } else {
                unsubscribeFromGroupLocations(groupId);
            }
        };
    }, [groupId, subscribeToGroupLocations, unsubscribeFromGroupLocations]);

    return {
        locations,
        isLoading,
        error,
    };
}
