import LoadingScreen from "@/src/app/loading";
import UnauthorizedScreen from "@/src/app/unauthorized";
import { useAuthStore } from "@/src/core/stores/authStore";
import { Stack } from "expo-router";

export default function superadminLayout(){
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const role = useAuthStore(s => s.role);

    if(isLoading) return <LoadingScreen/>
    if(!user || role !== 'superadmin') return <UnauthorizedScreen/>
    
    return <Stack/>
}