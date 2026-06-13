import React from 'react';
import { View } from 'react-native';

import CustomLoading from '@/src/components/CustomLoading';
import { Colors } from '@/src/constants/colors';
import useSignUp from '@/src/core/hook/auth/useSignUp';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import SignUpScreen from '@/src/features/Auth/screens/SignUpScreen';

export default function Signup() {
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
                onSignUpPress={onSignUpPress as any} 
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
    );
}
