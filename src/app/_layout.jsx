import { AuthProvider, useAuth } from '@/src/core/context/AuthProvider';
import { Redirect, Stack } from 'expo-router';

export default function RootLayout() {
    console.log("Welcome to Thrail: Find thrill in your trails!");
    console.log("2025");

    return (
        <AuthProvider>
            <RootNavLayout/>
            <Stack screenOptions={{headerShown: false}}/>
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