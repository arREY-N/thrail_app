import { AuthProvider, useAuth } from '@/src/core/context/AuthProvider';
import { RecommendationProvider } from '@/src/core/context/RecommendationProvider';
import { WeatherProvider } from '@/src/core/context/WeatherProvider';
import { Redirect, Stack } from 'expo-router';

export default function RootLayout() {
    console.log("Welcome to Thrail: Find thrill in your trails!");
    console.log("2025");

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
    const { user, profile, isLoading } = useAuth();

    if(isLoading) return null;

    if(!user) return <Redirect href={'/(auth)/landing'}/>
    
    if(!profile?.onBoardingComplete) return <Redirect href={'/(auth)/preference'}/>
    
    return <Redirect href={'/(tabs)/home'}/>
}