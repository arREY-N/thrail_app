import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../core/stores/authStore';
import LoadingScreen from './loading';

export default function RootLayout() {
    const initialize = useAuthStore.getState().initialize;
    const isLoading = useAuthStore(s => s.isLoading);

    useEffect(() => {
        const unsub = initialize();
        return () => unsub?.();
    }, []);

    console.log('root', isLoading)
   
    if(isLoading) return <LoadingScreen/>
    
    return <Stack screenOptions = {{headerShown: false}}/>

}