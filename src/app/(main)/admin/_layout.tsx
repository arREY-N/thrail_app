import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import { Stack } from "expo-router";

export default function adminLayout(){
    const { role, isLoading } = useAuthHook();
    if(isLoading) return <LoadingScreen/>

    if(role !== 'admin') return <UnauthorizedScreen/>

    return <Stack screenOptions={{ title: 'Admin Dashboard' }}/>
}