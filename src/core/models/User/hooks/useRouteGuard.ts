import { useAuthHook } from "@/src/core/models/User/hooks/useAuthHook";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export function useRouteGuard() {
    const { user, isLoading, isHydrated } = useAuthHook();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();

    useEffect(() => {
        if (!navigationState?.key || isLoading || !isHydrated) {
            return;
        }

        const inAuthGroup = segments[0] === "(auth)";
        const inProtectedGroup = segments[0] === "(main)" || segments[0] === "(tabs)";

        if (!user && inProtectedGroup) {
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [user, isLoading, isHydrated, segments, navigationState?.key, router]);
}
