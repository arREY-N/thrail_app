import { SuperAdminProvider } from '@/src/core/context/SuperAdminProvider';
import { useAuthStore } from '@/src/core/stores/authStore';
import { Stack, useRouter } from "expo-router";
import { useEffect } from 'react';
import LoadingScreen from '../loading';
import UnauthorizedScreen from '../unauthorized';

export default function SuperAdminLayout(){
    const router = useRouter();

    const user = useAuthStore(s => s.user);
    const isLoading = useAuthStore(s => s.isLoading);
    const role = useAuthStore(s => s.role);

    useEffect(() => {
        if(!user && !isLoading) {
            router.replace('/(auth)/landing');
        } 
    }, [user, isLoading]);

    if(!role) return <LoadingScreen/>

    if(role !== 'superadmin') return <UnauthorizedScreen/>
    
    return(     
        <SuperAdminProvider>
            <Stack screenOptions={{title: 'Superadmin'}}/>
        </SuperAdminProvider>
    )
}