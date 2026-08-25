
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import useRouteGuard from "@/src/core/hook/user/useRouteGuard";
import { Stack } from "expo-router";
import LoadingScreen from "../loading";

export default function MainLayout() {
    const { isLoading } = useAuthHook();

    useRouteGuard();

    if (isLoading) return <LoadingScreen />


    return <Stack screenOptions={{ headerShown: false }} />
}