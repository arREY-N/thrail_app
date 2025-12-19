import LandingScreen from '@/src/features/Auth/screens/LandingScreen';
import { useRouter } from 'expo-router';
import React from 'react';

export default function landing(){
    const router = useRouter();
        
    const onLogIn = () => {
        router.push('/(auth)/login');
    }

    const onSignUp = () => {
        router.push('/(auth)/signup');
    }
    
    const onPrivacy = () => {
        router.push('/(auth)/privacy');
    }

    const onTerms = () => {
        router.push('/(auth)/terms')
    }

    return <LandingScreen 
                onLogIn={onLogIn} 
                onSignUp={onSignUp}
                onPrivacy={onPrivacy}
                onTerms={onTerms}/>
}