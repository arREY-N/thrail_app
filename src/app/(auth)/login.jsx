import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { forgotPassword } from '@/src/core/FirebaseAuthUtil';
import { useAuthStore } from '@/src/core/stores/authStore';

import CustomLoading from '@/src/components/CustomLoading';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

export default function login(){
    const router = useRouter();
    //Testing the Loading
    const [isTestLoading, setIsTestLoading] = useState(false);
    //
    const error = useAuthStore(s => s.error);
    const profile = useAuthStore(s => s.profile);
    const isLoading = useAuthStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);
    const remember = useAuthStore(s => s.remember);

    const logIn = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    //Testing the Loading
    const lock = (isLoading || isTestLoading || (user && !profile));
    
    const onLogIn = async (email, password) => {
        setIsTestLoading(true); 
        
        console.log("Starting forced delay...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log("Delay finished, logging in.");

        setIsTestLoading(false); 

        await logIn(email, password);
    }
    //
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
        <View style={{ flex: 1 }}>
            <LogInScreen 
                onLogInPress={onLogIn} 
                onSignUpPress={onSignUpPress} 
                error={error} 
                onForgotPasswordPress={onForgotPassword}
                onBackPress={onBackPress}
                onRememberMePress={onRememberMePress}
                remember={remember}
            />

            <CustomLoading visible={lock} message="Signing in..." />
        </View>
    )
}