import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import { useAuthStore } from '@/src/core/stores/authStore';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import LoadingScreen from './loading';

export default function RootLayout() { 
    const { isLoading } = useAuthHook();
    const initialize = useAuthStore.getState().initialize;
    
    useEffect(() => {
        const unsub = initialize();
        return () => unsub?.();
    }, []);


    console.log('root', isLoading)
   
    if(isLoading) return <LoadingScreen/>
    
    return <Stack screenOptions = {{headerShown: false}}/>

}