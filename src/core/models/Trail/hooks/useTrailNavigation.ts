import { router } from "expo-router";

export function useTrailNavigation() {
    const onViewTrail = (trailId: string) => {
        router.push({
            pathname: '/(main)/trail/view',
            params: { trailId }
        })
    }

    const onWriteTrail = (trailId: string) => {
        if (trailId) {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
                params: { trailId }
            });
        } else {
            router.push({
                pathname: '/(main)/superadmin/trail/write',
            });
        }
    }

    return {
        onViewTrail,
        onWriteTrail
    }
}