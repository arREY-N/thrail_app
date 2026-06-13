import React, { useEffect } from 'react';
import { View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

export default function Login() {
    const { 
        onLanding,
        onSignUpPress 
    } = useAppNavigation();
    
    const { 
        error,
        remember,
        reset,
        onLogIn,
        onRememberMePress,
        onForgotPassword,
        onGmailLogIn,
        isLoading,
    } = useAuthHook();    

    useEffect(() => {
        reset();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <LogInScreen 
                onLogInPress={onLogIn as any} 
                onSignUpPress={onSignUpPress as any} 
                error={error} 
                onForgotPasswordPress={onForgotPassword}
                onBackPress={onLanding}
                onRememberMePress={onRememberMePress}
                remember={remember}
                onGmailLogIn={onGmailLogIn}
            />

            <CustomLoading 
                visible={isLoading} 
                message="Signing in..." 
            />
        </View>
    );
}
