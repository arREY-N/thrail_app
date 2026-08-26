import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export default function useRouteGuard() {
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
            console.log('no user && in protected group')
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            console.log('user && in auth group')
            router.replace("/(tabs)");
        } else {
            console.log('malay')
            router.replace("/");
        }
    }, [user, isLoading, isHydrated, segments, navigationState?.key, router]);
}
