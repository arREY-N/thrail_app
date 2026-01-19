import { forgotPassword } from '@/src/core/FirebaseAuthUtil';
import { useAuthStore } from '@/src/core/stores/authStore';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function login(){
    const router = useRouter();
    const error = useAuthStore(s => s.error);
    const profile = useAuthStore(s => s.profile);
    const isLoading = useAuthStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);
    const remember = useAuthStore(s => s.remember);

    const logIn = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    
    const lock = (isLoading || (user && !profile));
    
    const onLogIn = async (email, password) => {
        await logIn(email, password);
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
        <View>
            { lock && <Text>LOADING</Text> }
            <LogInScreen 
                onLogInPress={onLogIn} 
                onSignUpPress={onSignUpPress} 
                error={error} 
                onForgotPasswordPress={onForgotPassword}
                onBackPress={onBackPress}
                onRememberMePress={onRememberMePress}
                remember={remember}/>
        </View>
    )
}