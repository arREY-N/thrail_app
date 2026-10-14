import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAuthStore } from "@/src/core/models/User/User";
import { Redirect, Stack, useSegments } from "expo-router";

export const unstable_settings = {
    initialRouteName: 'index',
};

/**
 * Layout component for the Superadmin section.
 * Enforces role-based access control (RBAC) to restrict access to superadmins.
 * If an admin visits legacy /superadmin/trail/* links, they are redirected to /admin/trail/*.
 * 
 * @returns {React.ReactElement} The Stack navigator if authorized, Redirect, or UnauthorizedScreen.
 */
export default function SuperadminLayout() {
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const role = useAuthStore(s => s.role);
    const segments = useSegments();

    if (isLoading) return <LoadingScreen />

    if (!user) return <UnauthorizedScreen />

    if (role === "superadmin") {
        return <Stack screenOptions={{ headerShown: false }} />;
    }

    // Graceful backward-compatibility redirect for legacy links:
    // If an admin navigates to /superadmin/trail/*, redirect to /admin/trail/*
    const isTrailRoute = (segments as string[]).includes("trail");
    if (role === "admin" && isTrailRoute) {
        if ((segments as string[]).includes("write")) {
            return <Redirect href="/admin/trail/write" />;
        }
        if ((segments as string[]).includes("map-editor")) {
            return <Redirect href="/admin/trail/map-editor" />;
        }
        return <Redirect href="/admin/trail/list" />;
    }

    return <UnauthorizedScreen />;
}