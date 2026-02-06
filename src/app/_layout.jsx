import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../core/stores/authStore';
import LoadingScreen from './loading';

export default function RootLayout() {
    const initialize = useAuthStore((state) => state.initialize);
    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);

    useEffect(() => {
        const unsub = initialize();
        return () => {
            if(unsub) unsub();
        }
    }, [user?.uid]);

    if(isLoading) return <LoadingScreen/>

    return <Stack screenOptions = {{headerShown: false}}/>
    
}