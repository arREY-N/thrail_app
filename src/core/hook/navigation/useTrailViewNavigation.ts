/**
 * @file useTrailViewNavigation.ts
 * @description Dedicated route-specific navigation hook for the Trail Details view flow.
 * Manages origin-aware routing to /trail/view and handles cross-platform back navigation
 * without web teleportation.
 */

import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Platform } from "react-native";

export type TrailOrigin = "explore" | "home" | "recommendation" | string;

/**
 * Hook providing dedicated navigation actions for entering and exiting TrailScreen.
 *
 * @returns Object containing toTrailView, onTrailBackPress, and origin.
 */
export function useTrailViewNavigation() {
    const { from } = useLocalSearchParams<{ from?: string | string[] }>();
    const origin = (Array.isArray(from) ? from[0] : from) as TrailOrigin | undefined;

    /**
     * Navigates to a trail details view while tagging the origin screen.
     *
     * @param trailId - The ID of the trail to view.
     * @param callerOrigin - Optional origin identifier (e.g. 'explore', 'home').
     */
    const toTrailView = useCallback((trailId: string, callerOrigin?: TrailOrigin) => {
        router.push({
            pathname: "/trail/view",
            params: {
                trailId,
                ...(callerOrigin ? { from: callerOrigin } : {}),
            },
        });
    }, []);

    /**
     * Origin-aware back handler for TrailScreen.
     * On Web: Checks explicit origin or browser history to prevent teleportation to home.
     * On Native: Delegates cleanly to standard router.back() stack popping.
     */
    const onTrailBackPress = useCallback(() => {
        if (Platform.OS === "web") {
            if (origin === "explore") {
                router.replace("/(app)/(tabs)/explore");
                return;
            }
            if (origin === "home") {
                router.replace("/");
                return;
            }
            if (typeof window !== "undefined" && window.history && window.history.length > 1) {
                window.history.back();
                return;
            }
            router.replace("/(app)/(tabs)/explore");
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace("/");
            }
        }
    }, [origin]);

    return {
        origin,
        toTrailView,
        onTrailBackPress,
    };
}

