import { forgotPassword } from '@/src/core/FirebaseAuthUtil';
import { useAuthStore } from '@/src/core/stores/authStore';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import { useRouter } from 'expo-router';
import React from 'react';

export default function login(){
    const router = useRouter();
    const error = useAuthStore(s => s.error);
    const logIn = useAuthStore((state) => state.logIn)
    const profile = useAuthStore(s => s.profile);
    const isLoading = useAuthStore(s => s.isLoading);
    
    const onLogIn = async (email, password) => {
        const res = await logIn(email, password);
        console.log(res);
        console.log('Profile: ', profile ?? '-');
    }

    const onForgotPassword = async (email) => {
        await forgotPassword(email)
    }

    const onBackPress = () => {
        router.back();
    }

    const onSignUpPress = () => {
        router.replace('/(auth)/signup');
    }

    return (
        <LogInScreen 
            onLogInPress={onLogIn} 
            onSignUpPress={onSignUpPress} 
            error={error} 
            onForgotPasswordPress={onForgotPassword}
            onBackPress={onBackPress}
            isLoading={isLoading}/>
    )
}