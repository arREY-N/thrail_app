import { BusinessProvider } from '@/src/core/context/BusinessProvider';
import { useAuthStore } from '@/src/core/stores/authStore';
import { Stack, useRouter } from "expo-router";
import { useEffect } from 'react';
import LoadingScreen from '../loading';
import UnauthorizedScreen from '../unauthorized';

export default function AdminLayout(){
    const router = useRouter();
    
    const user = useAuthStore((state) => state.user);
    const role = useAuthStore((state) => state.role);
    const isLoading = useAuthStore((state) => state.isLoading);
    
    useEffect(() => { 
        if(!isLoading && !user) {
            router.replace('/(auth)/landing');
            return
        }
    }, [user]);
    
    if(!role) return <LoadingScreen/>;

    if(role === 'user') return <UnauthorizedScreen/>

    return(
        <BusinessProvider>
            <Stack>
                <Stack.Screen
                    name = 'index'
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