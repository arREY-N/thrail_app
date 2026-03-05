import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import React, { useEffect } from 'react';


import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';

export default function login(){
    const { 
        onBackPress, 
        onSignUpPress 
    } = useAppNavigation();
    
    const { 
        error,
        remember,
        reset,
        onLogIn,
        onRememberMePress,
        onForgotPassword,
    } = useAuthHook();    

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