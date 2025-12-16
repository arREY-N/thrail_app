import { View, Text, Pressable } from 'react-native'
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router';
import LandingScreen from '@/src/features/Auth/screens/LandingScreen';

export default function landing(){
    const router = useRouter();
    
    const onLogIn = () => {
        router.push('/(auth)/login');
    }

    const onSignUp = () => {
        router.push('/(auth)/signup');
    }

    return <LandingScreen onLogIn={onLogIn} onSignUp={onSignUp}/>
}