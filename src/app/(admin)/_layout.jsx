import { BusinessProvider } from '@/src/core/context/BusinessProvider';
import { useAuthStore } from '@/src/core/stores/authStore';
import { useTrailsStore } from '@/src/core/stores/trailsStore';
import { Stack, useRouter } from "expo-router";
import { useEffect } from 'react';
import LoadingScreen from '../loading';
import UnauthorizedScreen from '../unauthorized';

export default function AdminLayout(){
    const router = useRouter();
    
    const user = useAuthStore(s => s.user);
    const role = useAuthStore(s => s.role);
    const isLoading = useAuthStore(s => s.isLoading);
    const loadTrails = useTrailsStore(s => s.loadTrails);
    
    useEffect(() => { 
        if(!isLoading && !user) {
            // router.replace('/(auth)/landing');
            return
        }

        loadTrails();
    }, [user]);
    
    if(!isLoading && !user){
        router.replace('/(auth)/landing');
    }
    
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