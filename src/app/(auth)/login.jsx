import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

import { useAuthStore } from '@/src/core/stores/authStore';

import CustomLoading from '@/src/components/CustomLoading';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

export default function login(){
    const { onBackPress, onSignUpPress } = useAppNavigation();

    const router = useRouter();
    
    const error = useAuthStore(s => s.error);
    const profile = useAuthStore(s => s.profile);
    const isLoading = useAuthStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);
    const remember = useAuthStore(s => s.remember);
    const reset = useAuthStore(s => s.reset);

    const onLogInPress = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    const onGmailLogIn = useAuthStore(s => s.gmailLogIn);    
    const onForgotPassword = useAuthStore(s => s.forgotPassword);

    const isLogingIn = isLoading || (user && !profile);

    useEffect(() => {
        reset();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <LogInScreen 
                onLogInPress={onLogInPress} 
                onSignUpPress={onSignUpPress} 
                error={error} 
                onForgotPasswordPress={onForgotPassword}
                onBackPress={onBackPress}
                onRememberMePress={onRememberMePress}
                remember={remember}
                onGmailLogIn={onGmailLogIn}
            />

            <CustomLoading 
                visible={isLogingIn} 
                message="Signing in..." 
            />
        </View>
    )
}