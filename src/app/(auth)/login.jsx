import { forgotPassword } from '@/src/core/FirebaseAuthUtil';
import { useAuthStore } from '@/src/core/stores/authStore';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

export default function login(){
    const router = useRouter();
    const [error, setError] = useState(null);
    const logIn = useAuthStore((state) => state.logIn)

    const onLogIn = async (email, password) => {
        setError(null);
        try{
            const res = await logIn(email, password);
        } catch (err) {
            setError(err.message);
        }
    }

    const onForgotPassword = async (email) => {
        setError(null);
        try{
            await forgotPassword(email)
        }catch(error){
            setError(error.message)
        }
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
            onBackPress={onBackPress}/>
    )
}