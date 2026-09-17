import { router } from "expo-router";

export function useHikeNavigation() {
    const viewHike = (id: string) => {
        router.push({
            pathname: '/(main)/hike/view',
            params: { hikeId: id }
        })
    }

    return {
        viewHike,
    }
}