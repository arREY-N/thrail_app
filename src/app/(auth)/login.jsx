import { useAppNavigation } from '@/src/core/hook/useAppNavigation';
import React, { useEffect } from 'react';

import { useAuthStore } from '@/src/core/stores/authStore';

import { useAuthHook } from '@/src/core/hook/useAuthHook';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

export default function login(){
    const { onBackPress, onSignUpPress } = useAppNavigation();
    
    const { error } = useAuthHook();    
    const remember = useAuthStore(s => s.remember);
    const reset = useAuthStore(s => s.reset);
    const onLogIn = useAuthStore(s => s.logIn);
    const onRememberMePress = useAuthStore(s => s.rememberMe)
    const onForgotPassword = useAuthStore(s => s.forgotPassword);

    useEffect(() => {
        reset();
    }, []);

    return (
        <LogInScreen 
            onLogInPress={onLogIn} 
            onSignUpPress={onSignUpPress} 
            error={error} 
            onForgotPasswordPress={onForgotPassword}
            onBackPress={onBackPress}
            onRememberMePress={onRememberMePress}
            remember={remember}
        />
    )
}