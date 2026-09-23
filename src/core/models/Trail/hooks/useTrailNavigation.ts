import { useAuthHook } from "@/src/core/models/User/User";
import { router } from "expo-router";

export function useTrailNavigation() {
    const { isSuperadmin } = useAuthHook();

    const onViewTrail = (trailId: string) => {
        router.push({
            pathname: '/trail/view',
            params: { trailId }
        });
    };

    const onWriteTrail = (trailId?: string | null) => {
        if (isSuperadmin) {
            if (trailId) {
                router.push({
                    pathname: '/superadmin/trail/write',
                    params: { trailId }
                });
            } else {
                router.push('/superadmin/trail/write');
            }
        } else {
            if (trailId) {
                router.push({
                    pathname: '/admin/trail/write',
                    params: { trailId }
                });
            } else {
                router.push('/admin/trail/write');
            }
        }
    };

    return {
        onViewTrail,
        onWriteTrail
    };
}