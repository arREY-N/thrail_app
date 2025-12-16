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
    const { user, isLoading } = useAuth();
    console.log("No user logged in, yet!");
    console.log(user)

    if(user === null){
        return(
            <Redirect href={'/(auth)/landing'}/>
        )
    } else {
        return(
            <Redirect href={'/(tabs)/home'}/>
        )
    }
}