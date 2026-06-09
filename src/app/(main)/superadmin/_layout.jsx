import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { Stack, useSegments } from "expo-router";

/**
 * Layout component for the Superadmin section.
 * Enforces role-based access control (RBAC) to restrict access to superadmins,
 * but allows admins (role: 'admin') access specifically to trail management routes.
 * 
 * @returns {React.ReactElement} The Stack navigator if authorized, or UnauthorizedScreen.
 */
export default function superadminLayout(){
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const role = useAuthStore(s => s.role);
    const segments = useSegments();

    // if(isLoading) return <LoadingScreen/>

    if(!user) return <UnauthorizedScreen/>

    // Allow both superadmin and admin roles to access trail management routes.
    // Other superadmin panels remain restricted to superadmin only.
    const isTrailRoute = segments.includes("trail");

    if (role === "superadmin") {
        return <Stack screenOptions={{ headerShown: false}}/>;
    }

    if (role === "admin" && isTrailRoute) {
        return <Stack screenOptions={{ headerShown: false}}/>;
    }

    return <UnauthorizedScreen/>;
}