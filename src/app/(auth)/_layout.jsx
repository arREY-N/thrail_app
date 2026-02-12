import { Stack } from "expo-router";

export default function AuthLayout(){
    console.log('auth');
    return <Stack screenOptions={{headerShown: false}}/>
}