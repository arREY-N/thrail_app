import { BusinessProvider } from '@/src/core/context/BusinessProvider';
import { useAuthStore } from '@/src/core/stores/authStore';
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from 'react';

export default function AdminLayout(){
    const user = useAuthStore((state) => state.user);
    const role = useAuthStore((state) => state.role);
    const isLoading = useAuthStore((state) => state.isLoading);
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();
    
    useEffect(() => {
        if(!rootNavigationState?.key) return;
        
        if(isLoading) return;

        if(!user) {
            router.replace('/(auth)/landing');
            return
        }

        if(role && role === 'user'){
            router.replace('/(tabs)/home');
            return;
        }        
    }, [user, role, rootNavigationState?.key, isLoading]);

    return(     
        <BusinessProvider>
            <Stack>
                <Stack.Screen
                    name = 'home'
                    options = {{
                        title: 'Admin Home',
                        headerShown: true,
                    }}
                />
                <Stack.Screen
                    name = 'personnel'
                    options = {{
                        title: 'Personnel',
                        headerShown: true,
                    }}
                />
                <Stack.Screen
                    name = 'offer'
                    options = {{
                        title: 'Offers',
                        headerShown: true,
                    }}
                />
            </Stack>
        </BusinessProvider>
    )
}