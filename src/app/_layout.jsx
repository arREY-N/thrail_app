import { AuthProvider, useAuth } from '@/src/core/context/AuthProvider';
import { RecommendationProvider } from '@/src/core/context/RecommendationProvider';
import { WeatherProvider } from '@/src/core/context/WeatherProvider';
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useTrailsStore } from '../core/stores/trailsStore';

export default function RootLayout() {
    return (
        <AuthProvider>
            <RecommendationProvider>
                <WeatherProvider>
                    <RootNavLayout/>
                    <Stack screenOptions={{headerShown: false}}/>
                </WeatherProvider>
            </RecommendationProvider>
        </AuthProvider>
    );
}

const RootNavLayout = () => {
    const { user, profile, isLoading, role } = useAuth();
    const { loadTrails } = useTrailsStore();
    
    useEffect(() => {
        console.log("Welcome to Thrail: Find thrill in your trails!");
        console.log("2025");
        loadTrails();
    }, []);

    const isWeb = false;

    if(!user) return <Redirect href={'/(auth)/landing'}/>

    if(role === 'superadmin') return <Redirect href={'/(superadmin)/home'}/>;
    
    if(role === 'admin') return <Redirect href={'/(business)/home'}/>;

    if(role === 'user'){
        if(profile && !profile.onBoardingComplete) return <Redirect href={'/(auth)/preference'}/>
        return <Redirect href={'/(tabs)/home'}/>
    }

    return null;
}