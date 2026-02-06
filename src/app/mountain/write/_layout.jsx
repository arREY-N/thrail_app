import { useAuthStore } from "@/src/core/stores/authStore";
import { Redirect, Stack } from "expo-router";

export default function WriteMountainLayout(){
    const user = useAuthStore(s => s.user);
    const role = useAuthStore(s => s.role);

    if(user && role !== 'superadmin') return <Redirect href={'/unauthorized'}/>

    return <Stack screenOptions={{headerShown: false}}/>
}