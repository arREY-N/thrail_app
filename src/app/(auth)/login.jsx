import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import React, { useEffect } from 'react';

import CustomLoading from '@/src/components/CustomLoading';
import { useAuthHook } from '@/src/core/hook/user/useAuthHook';
import LogInScreen from '@/src/features/Auth/screens/LogInScreen';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function login(){
    const { 
        onBackPress, 
        onSignUpPress 
    } = useAppNavigation();
    
    const { 
        error,
        remember,
        reset,
        //onLogIn,
        onRememberMePress,
        onForgotPassword,
        onGmailLogIn,
        isLoading,
    } = useAuthHook();    

    useEffect(() => {
        reset();
    }, []);

    // TODO: Remove this when the temp hike screen is done
    const onTempHikePress = () => {
        router.push('/(auth)/tempHike');
    }

    const onLogIn = () => {
        router.push('/(tabs)')
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
                onGmailLogIn={onTempHikePress}
            />

            <CustomLoading 
                visible={isLoading} 
                message="Signing in..." 
            />
        </View>
    )
}