import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import { View } from 'react-native';


import CustomLoading from '@/src/components/CustomLoading';
import useSignUp from '@/src/core/hook/auth/useSignUp';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';

import { Colors } from '@/src/constants/colors';

import React from 'react';
 
export default function signup(){
    const {
        error,
        isLoading,
        onGmailSignUp,
        onSignUpPress,
    } = useSignUp(true);
    
    const { onBackPress, onLogIn } = useAppNavigation();


    return (  
        <View style={{ flex: 1, backgroundColor: Colors.BACKGROUND }}>
            <SignUpScreen
                onSignUpPress={onSignUpPress} 
                onLogInPress={onLogIn} 
                onBackPress={onBackPress}
                onGmailSignUp={onGmailSignUp}
                error={error}
            />

            <CustomLoading 
                visible={isLoading} 
                message="Validating..." 
            />
        </View>
    )
}