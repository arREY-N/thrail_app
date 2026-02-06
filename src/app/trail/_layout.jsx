import { useAuthStore } from "@/src/core/stores/authStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { Stack } from "expo-router";

export default function trailLayout(){
    const authIsLoading = useAuthStore(s => s.isLoading);
    const trailIsLoading = useTrailsStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);

    if(authIsLoading || trailIsLoading) return null;
    
    return <Stack screenOptions={{title: 'Trail'}}/> 
}