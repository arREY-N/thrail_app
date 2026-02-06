import { useAuthStore } from "@/src/core/stores/authStore";
import { Redirect, Stack } from "expo-router";
import LoadingScreen from "../../loading";

export default function writeLayout(){
    const isLoading = useAuthStore(s => s.isLoading);
    const role = useAuthStore(s => s.role);
    const user = useAuthStore(s => s.user);

    console.log('in write')

    if(user && isLoading) {
        console.log('loading');
        return <LoadingScreen/>
    };

    if(!user) {
        console.log('no user')
        return <Redirect href={'/'}/>    
    }
    if(user && role !== 'superadmin'){
        return <Redirect href={'/unauthorized'}/>
    }

    return <Stack screenOptions={{headerShown: false}}/>
}