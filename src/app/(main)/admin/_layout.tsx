import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAuthHook } from "@/src/core/models/User/User";
import { Stack } from "expo-router";

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function AdminLayout() {
    const { role, isLoading } = useAuthHook();
    if (isLoading) return <LoadingScreen />

    if (role !== 'admin') return <UnauthorizedScreen />

    return <Stack screenOptions={{ title: 'Admin Dashboard' }} />
}