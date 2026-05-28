
import { useAuthStore } from "@/src/core/stores/authStores/authStore";
import { Stack } from "expo-router";
import LoadingScreen from "../loading";

export default function mainLayout(){
    const isLoading = useAuthStore(s => s.isLoading);

    if(isLoading) return <LoadingScreen/>

    return <Stack screenOptions={{headerShown: false}}/>
}