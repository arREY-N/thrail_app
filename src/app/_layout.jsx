import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../core/stores/authStore';

export default function RootLayout() {
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        const unsub = initialize();
        return () => unsub();
    }, []);

    return(
        <Stack screenOptions = {{headerShown: false}}>
            <Stack.Screen name="index"/>
            <Stack.Screen name="(auth)"/>
            <Stack.Screen name="(tabs)"/>
            <Stack.Screen name="(superadmin)"/>
            <Stack.Screen name="(admin)"/>
        </Stack>
    )
}