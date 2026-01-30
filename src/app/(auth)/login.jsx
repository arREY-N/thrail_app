import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useAuthStore } from '@/src/core/stores/authStore';

import CustomLoading from '@/src/components/CustomLoading';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

export default function login(){
    const { onBackPress, onSignUpPress } = useAppNavigation();
    
    const router = useRouter();
    //Testing the Loading
    const [isTestLoading, setIsTestLoading] = useState(false);
    //
    const error = useAuthStore(s => s.error);
    const profile = useAuthStore(s => s.profile);
    const isLoading = useAuthStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);
    const remember = useAuthStore(s => s.remember);
    const reset = useAuthStore(s => s.reset);

    const onLogIn = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    const onGmailLogIn = useAuthStore(s => s.gmailLogIn);    
    const onForgotPassword = useAuthStore(s => s.forgotPassword);

    const logIn = useAuthStore(s => s.logIn);
    //Testing the Loading
    const lock = (isLoading || isTestLoading || (user && !profile));
    
    // const onLogIn = async (email, password) => {
    //     setIsTestLoading(true); 
        
    //     console.log("Starting forced delay...");
    //     await new Promise(resolve => setTimeout(resolve, 500));
    //     console.log("Delay finished, logging in.");

    //     setIsTestLoading(false); 

    //     await logIn(email, password);
    // }
    

    useEffect(() => {
        reset();
    }, []);

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