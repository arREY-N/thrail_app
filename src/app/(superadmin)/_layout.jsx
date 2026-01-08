import { SuperAdminProvider } from '@/src/core/context/SuperAdminProvider';
import { useAuthStore } from '@/src/core/stores/authStore';
import { Stack, useRouter } from "expo-router";
import { useEffect } from 'react';

export default function SuperAdminLayout(){
    const router = useRouter();

    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);

    useEffect(() => {
        if(!user && !isLoading) {
            router.replace('/(auth)/landing');
        } 
    }, [user, isLoading]);
    
    return(     
        <SuperAdminProvider>
            <Stack>
                <Stack.Screen
                    name = 'home'
                    options = {{
                        title: 'Superadmin Home',
                        headerShown: true,
                    }}
                />
                <Stack.Screen
                    name = 'business'
                    options = {{
                        title: 'Businesses',
                        headerShown: true,
                    }}
                />
                <Stack.Screen
                    name = 'trail'
                    options = {{
                        title: 'Trails',
                        headerShown: true,
                    }}
                />
                <Stack.Screen
                    name = 'user'
                    options = {{
                        title: 'Users',
                        headerShown: true,
                    }}
                />
            </Stack>
        </SuperAdminProvider>
    )
}