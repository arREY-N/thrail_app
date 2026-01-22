import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import { useAuthStore } from '@/src/core/stores/authStore';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function login(){
    const { onBackPress, onSignUpPress } = useAppNavigation();
    
    const error = useAuthStore(s => s.error);
    const profile = useAuthStore(s => s.profile);
    const isLoading = useAuthStore(s => s.isLoading);
    const user = useAuthStore(s => s.user);
    const remember = useAuthStore(s => s.remember);
    const reset = useAuthStore(s => s.reset);
    
    const lock = (isLoading || (user && !profile));

    const onLogIn = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    const onGmailLogIn = useAuthStore(s => s.gmailLogIn);    
    const onForgotPassword = useAuthStore(s => s.forgotPassword);

    useEffect(() => {
        reset();
    }, []);

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
                remember={remember}
                onGmailLogIn={onGmailLogIn}/>
        </View>
    )
}