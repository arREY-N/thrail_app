import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAuthStore } from "@/src/core/stores/authStore";
import { Stack } from "expo-router";

export default function adminLayout(){
    const role = useAuthStore(s => s.role);
    const loading = useAuthStore(s => s.isLoading);

    if(loading) return <LoadingScreen/>

    if(role !== 'admin') return <UnauthorizedScreen/>

    return <Stack screenOptions={{ title: 'Admin Dashboard' }}/>
}